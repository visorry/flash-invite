import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { InviteLinkStatus, TransactionType, TransactionStatus, getSecondsPerUnit } from '@super-invite/db'
import { generatePrismaInclude } from '../helper/db/include'
import { DBEntity } from '../constant/db'
import { withTransaction } from '../helper/db/transaction'

// Max duration: 2 years in seconds
const MAX_DURATION_SECONDS = 2 * 365 * 24 * 60 * 60 // 63072000 seconds

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

  // Add inviteLink alias for backward compatibility
  const itemsWithAlias = items.map(item => ({
    ...item,
    inviteLink: item.botStartLink, // Alias for web app
  }))

  return {
    items: itemsWithAlias,
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

  // Add inviteLink alias for backward compatibility
  return {
    ...invite,
    inviteLink: invite.botStartLink,
  }
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

  // Validate max duration (2 years)
  if (data.durationSeconds > MAX_DURATION_SECONDS) {
    throw new BadRequestError('Duration cannot exceed 2 years')
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

    // Calculate token cost for this duration
    const costConfigs = await tx.tokenCostConfig.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: { durationUnit: 'desc' }, // Start from largest unit
    })

    let tokensCost = 0
    let remainingSeconds = data.durationSeconds

    for (const config of costConfigs) {
      const secondsPerUnit = getSecondsPerUnit(config.durationUnit)
      const units = Math.floor(remainingSeconds / secondsPerUnit)

      if (units > 0) {
        tokensCost += units * config.costPerUnit
        remainingSeconds -= units * secondsPerUnit
      }
    }

    // Check user has enough tokens
    if (tokensCost > 0) {
      const balance = await tx.tokenBalance.findUnique({
        where: { userId: ctx.user!.id },
      })

      if (!balance || balance.balance < tokensCost) {
        throw new BadRequestError(`Insufficient tokens. Required: ${tokensCost}, Available: ${balance?.balance || 0}`)
      }

      // Deduct tokens
      const newBalance = balance.balance - tokensCost

      await tx.tokenBalance.update({
        where: { userId: ctx.user!.id },
        data: {
          balance: newBalance,
          totalSpent: { increment: tokensCost },
        },
      })

      // Create transaction record
      await tx.tokenTransaction.create({
        data: {
          userId: ctx.user!.id,
          type: TransactionType.INVITE_COST,
          status: TransactionStatus.COMPLETED,
          amount: -tokensCost,
          balanceAfter: newBalance,
          description: `Invite link creation (${formatDuration(data.durationSeconds)})`,
          reference: null, // Will update with invite ID after creation
        },
      })
    }

    // Invite link expiry - set to 30 days from now
    // This is different from member duration (how long they can stay after joining)
    // Link will expire after 30 days OR after first use (whichever comes first)
    const inviteLinkExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Generate unique token
    const token = generateToken()

    // Get primary bot for this entity
    const primaryBotLink = await tx.botTelegramEntity.findFirst({
      where: {
        telegramEntityId: data.telegramEntityId,
        isPrimary: true,
      },
      include: {
        bot: true,
      },
    })

    if (!primaryBotLink || !primaryBotLink.bot) {
      throw new BadRequestError('No bot is assigned to this group. Please link a bot first.')
    }

    const bot = primaryBotLink.bot
    const botUsername = bot.username.replace('@', '')

    if (!botUsername) {
      throw new BadRequestError('Bot username not available')
    }

    // Create bot start link
    const botStartLink = `https://t.me/${botUsername}?start=${token}`

    // Create invite link record
    const invite = await tx.inviteLink.create({
      data: {
        telegramEntityId: data.telegramEntityId,
        userId: ctx.user!.id,
        botId: bot.id,
        botStartLink,
        token, // Store token as root column for fast queries
        durationType: 0, // Custom duration
        durationSeconds: data.durationSeconds, // How long member can stay AFTER joining
        memberLimit: data.memberLimit ?? 1, // Default to 1 (one-time use)
        currentUses: 0,
        status: InviteLinkStatus.ACTIVE,
        linkExpiresAt: inviteLinkExpiresAt, // When the bot link expires (30 days)
        tokensCost,
        metadata: {
          name: data.name,
        },
      },
    })

    // Add inviteLink alias for backward compatibility
    return {
      ...invite,
      inviteLink: invite.botStartLink,
    }
  })
}

// Format duration for display
function formatDuration(seconds: number): string {
  const years = Math.floor(seconds / (365 * 24 * 60 * 60))
  seconds %= 365 * 24 * 60 * 60
  const months = Math.floor(seconds / (30 * 24 * 60 * 60))
  seconds %= 30 * 24 * 60 * 60
  const days = Math.floor(seconds / (24 * 60 * 60))
  seconds %= 24 * 60 * 60
  const hours = Math.floor(seconds / (60 * 60))
  seconds %= 60 * 60
  const minutes = Math.floor(seconds / 60)

  const parts = []
  if (years > 0) parts.push(`${years}y`)
  if (months > 0) parts.push(`${months}mo`)
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)

  return parts.join(' ') || '0m'
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

    // Note: Bot start links cannot be revoked on Telegram
    // We just mark them as revoked in our database

    // Update status
    const updated = await tx.inviteLink.update({
      where: { id },
      data: {
        status: InviteLinkStatus.REVOKED,
        revokedAt: new Date(),
      },
    })

    // Add inviteLink alias for backward compatibility
    return {
      ...updated,
      inviteLink: updated.botStartLink,
    }
  })
}

const getStats = async (ctx: RequestContext, id: string) => {
  const invite = await getById(ctx, id)

  return {
    inviteId: invite.id,
    botStartLink: invite.botStartLink,
    currentUses: invite.currentUses,
    memberLimit: invite.memberLimit,
    status: invite.status,
    linkExpiresAt: invite.linkExpiresAt,
    createdAt: invite.createdAt,
    tokensCost: invite.tokensCost,
  }
}

const checkExpired = async () => {
  // Find expired invites
  const expired = await db.inviteLink.findMany({
    where: {
      status: InviteLinkStatus.ACTIVE,
      linkExpiresAt: {
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
