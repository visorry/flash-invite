import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { InviteLinkStatus, TokenAction, getDurationSeconds } from '@super-invite/db'
import { telegramBot } from '../lib/telegram'
import { generatePrismaInclude } from '../helper/db/include'
import { DBEntity } from '../constant/db'
import { withTransaction } from '../helper/db/transaction'

const list = async (ctx: RequestContext) => {
  const include = generatePrismaInclude(DBEntity.Invite, ctx)
  const filter = ctx.filter || {}
  const pagination = ctx.pagination || {}

  // Add user filter
  if (ctx.user) {
    filter.userId = ctx.user.id
  }

  const [items, total] = await Promise.all([
    db.inviteLink.findMany({
      where: filter,
      ...(include && { include }),
      skip: pagination.skip,
      take: pagination.take,
      orderBy: pagination.orderBy || { createdAt: 'desc' },
    }),
    db.inviteLink.count({ where: filter }),
  ])

  return {
    items,
    total,
    page: pagination.current || 1,
    size: pagination.take || 20,
  }
}

const getById = async (ctx: RequestContext, id: string) => {
  const include = generatePrismaInclude(DBEntity.Invite, ctx)

  const invite = await db.inviteLink.findUnique({
    where: { id },
    ...(include && { include }),
  })

  if (!invite) {
    throw new NotFoundError('Invite link not found')
  }

  // Check ownership
  if (ctx.user && invite.userId !== ctx.user.id) {
    throw new NotFoundError('Invite link not found')
  }

  return invite
}

const create = async (ctx: RequestContext, data: {
  telegramEntityId: string
  durationType: TokenAction
  memberLimit?: number
  name?: string
}) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  return withTransaction(ctx, async (tx) => {
    // Get telegram entity
    const entity = await tx.telegramEntity.findUnique({
      where: { id: data.telegramEntityId },
    })

    if (!entity) {
      throw new NotFoundError('Telegram entity not found')
    }

    if (entity.userId !== ctx.user!.id) {
      throw new NotFoundError('Telegram entity not found')
    }

    if (!entity.isActive) {
      throw new BadRequestError('Telegram entity is not active')
    }

    // Get token cost
    const costConfig = await tx.tokenCostConfig.findUnique({
      where: { action: data.durationType },
    })

    if (!costConfig || !costConfig.isActive) {
      throw new BadRequestError('Invalid duration type')
    }

    // Check user balance
    const balance = await tx.tokenBalance.findUnique({
      where: { userId: ctx.user!.id },
    })

    if (!balance || balance.balance < costConfig.cost) {
      throw new BadRequestError('Insufficient token balance')
    }

    // Calculate expiry
    const durationSeconds = getDurationSeconds(data.durationType)
    const expiresAt = new Date(Date.now() + durationSeconds * 1000)

    // Create Telegram invite link
    try {
      const telegramInvite = await telegramBot.createChatInviteLink(entity.telegramId, {
        name: data.name,
        expire_date: Math.floor(expiresAt.getTime() / 1000),
        member_limit: data.memberLimit,
      })

      // Create invite link record
      const invite = await tx.inviteLink.create({
        data: {
          telegramEntityId: data.telegramEntityId,
          userId: ctx.user!.id,
          inviteLink: telegramInvite.invite_link,
          durationType: data.durationType,
          durationSeconds,
          memberLimit: data.memberLimit,
          currentUses: 0,
          status: InviteLinkStatus.ACTIVE,
          expiresAt,
          tokensCost: costConfig.cost,
        },
      })

      // Deduct tokens
      await tx.tokenBalance.update({
        where: { userId: ctx.user!.id },
        data: {
          balance: { decrement: costConfig.cost },
          totalSpent: { increment: costConfig.cost },
        },
      })

      // Create transaction record
      await tx.tokenTransaction.create({
        data: {
          userId: ctx.user!.id,
          type: 3, // INVITE_COST
          status: 1, // COMPLETED
          amount: -costConfig.cost,
          balanceAfter: balance.balance - costConfig.cost,
          description: `Created invite link for ${entity.title}`,
          reference: invite.id,
        },
      })

      return invite
    } catch (error: any) {
      throw new BadRequestError(`Failed to create Telegram invite link: ${error.message}`)
    }
  })
}

const revoke = async (ctx: RequestContext, id: string) => {
  const invite = await getById(ctx, id)

  if (invite.status !== InviteLinkStatus.ACTIVE) {
    throw new BadRequestError('Invite link is not active')
  }

  return withTransaction(ctx, async (tx) => {
    const entity = await tx.telegramEntity.findUnique({
      where: { id: invite.telegramEntityId },
    })

    if (!entity) {
      throw new NotFoundError('Telegram entity not found')
    }

    // Revoke on Telegram
    try {
      await telegramBot.revokeChatInviteLink(entity.telegramId, invite.inviteLink)
    } catch (error: any) {
      // Continue even if Telegram revoke fails
      console.error('Failed to revoke on Telegram:', error)
    }

    // Update status
    const updated = await tx.inviteLink.update({
      where: { id },
      data: {
        status: InviteLinkStatus.REVOKED,
        revokedAt: new Date(),
      },
    })

    return updated
  })
}

const getStats = async (ctx: RequestContext, id: string) => {
  const invite = await getById(ctx, id)

  return {
    inviteId: invite.id,
    inviteLink: invite.inviteLink,
    currentUses: invite.currentUses,
    memberLimit: invite.memberLimit,
    status: invite.status,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
    tokensCost: invite.tokensCost,
  }
}

const checkExpired = async () => {
  // Find expired invites
  const expired = await db.inviteLink.findMany({
    where: {
      status: InviteLinkStatus.ACTIVE,
      expiresAt: {
        lte: new Date(),
      },
    },
  })

  // Update status
  if (expired.length > 0) {
    await db.inviteLink.updateMany({
      where: {
        id: {
          in: expired.map(i => i.id),
        },
      },
      data: {
        status: InviteLinkStatus.EXPIRED,
      },
    })
  }

  return expired.length
}

export default {
  list,
  getById,
  create,
  revoke,
  getStats,
  checkExpired,
}
