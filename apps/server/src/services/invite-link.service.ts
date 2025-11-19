import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { InviteLinkStatus } from '@super-invite/db'
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
  durationSeconds: number
  memberLimit?: number | null
  name?: string | null
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

    // Calculate expiry
    const expiresAt = new Date(Date.now() + data.durationSeconds * 1000)

    // Generate unique token
    const token = generateToken()

    // Get bot username from config
    let botUsername = ''
    try {
      const botConfig = await tx.config.findUnique({
        where: { key: 'botUsername' },
      })
      if (botConfig?.value) {
        botUsername = botConfig.value
      }
    } catch (error) {
      console.warn('Failed to get bot username from config:', error)
    }

    // Fallback to env if not in config
    if (!botUsername) {
      botUsername = process.env.TELEGRAM_BOT_USERNAME || ''
    }

    // Remove @ if present
    botUsername = botUsername.replace('@', '')

    if (!botUsername) {
      throw new BadRequestError('Bot username not configured. Please set TELEGRAM_BOT_USERNAME in environment or configure in Admin Settings.')
    }

    // Create bot start link
    const inviteLink = `https://t.me/${botUsername}?start=${token}`

    // Create invite link record
    const invite = await tx.inviteLink.create({
      data: {
        telegramEntityId: data.telegramEntityId,
        userId: ctx.user!.id,
        inviteLink,
        durationType: 0, // Custom duration
        durationSeconds: data.durationSeconds,
        memberLimit: data.memberLimit ?? 1, // Default to 1 (one-time use)
        currentUses: 0,
        status: InviteLinkStatus.ACTIVE,
        expiresAt,
        tokensCost: 0, // Free for now, can add pricing later
        metadata: {
          token,
          name: data.name,
        },
      },
    })

    return invite
  })
}

// Generate random token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
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
