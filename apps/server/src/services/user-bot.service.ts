import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { BotStatus, TransactionType, TelegramEntityType } from '@super-invite/db'
import { withTransaction } from '../helper/db/transaction'
import { validateBotToken, addBot, removeBot } from '../bot/bot-manager'
import tokenService from './token.service'

// List all bots for the current user
const list = async (ctx: RequestContext) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const bots = await db.bot.findMany({
    where: {
      userId: ctx.user.id,
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          entityLinks: true,
          inviteLinks: true,
          botMembers: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return bots
}

// Get a specific bot by ID
const getById = async (ctx: RequestContext, botId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const bot = await db.bot.findFirst({
    where: {
      id: botId,
      userId: ctx.user.id,
      deletedAt: null,
    },
    include: {
      entityLinks: {
        include: {
          telegramEntity: true,
        },
      },
      _count: {
        select: {
          inviteLinks: true,
          botMembers: true,
        },
      },
    },
  })

  if (!bot) {
    throw new NotFoundError('Bot not found')
  }

  return bot
}

// Create a new bot
const create = async (ctx: RequestContext, token: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  // Validate the bot token with Telegram
  const validation = await validateBotToken(token)
  if (!validation.valid) {
    throw new BadRequestError(validation.error || 'Invalid bot token')
  }

  // Check if bot already exists (by Telegram bot ID)
  const existingBot = await db.bot.findFirst({
    where: {
      botId: validation.botId,
      deletedAt: null,
    },
  })

  if (existingBot) {
    if (existingBot.userId === ctx.user.id) {
      throw new BadRequestError('You have already added this bot')
    }
    throw new BadRequestError('This bot is already registered by another user')
  }

  // Check bot cost and user's token balance
  const userBotCount = await db.bot.count({
    where: {
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  const costConfig = await db.botCostConfig.findFirst({
    where: { isActive: true },
  })

  const freeBotsAllowed = costConfig?.freeBotsAllowed ?? 1
  const costPerBot = costConfig?.costPerBot ?? 0

  let tokensCost = 0
  if (userBotCount >= freeBotsAllowed && costPerBot > 0) {
    tokensCost = costPerBot

    // Check balance
    const balance = await tokenService.getBalance(ctx)
    if (balance.balance < tokensCost) {
      throw new BadRequestError(
        `Insufficient tokens. You need ${tokensCost} tokens to add another bot.`
      )
    }
  }

  // Create bot in database and deduct tokens if needed
  const bot = await withTransaction(ctx, async (tx) => {
    // Deduct tokens if required
    if (tokensCost > 0) {
      const userBalance = await tx.tokenBalance.findUnique({
        where: { userId: ctx.user!.id },
      })

      if (!userBalance || userBalance.balance < tokensCost) {
        throw new BadRequestError('Insufficient token balance')
      }

      const newBalance = userBalance.balance - tokensCost

      await tx.tokenBalance.update({
        where: { userId: ctx.user!.id },
        data: {
          balance: newBalance,
          totalSpent: { increment: tokensCost },
        },
      })

      await tx.tokenTransaction.create({
        data: {
          userId: ctx.user!.id,
          type: TransactionType.BOT_CREATION,
          status: 1, // COMPLETED
          amount: -tokensCost,
          balanceAfter: newBalance,
          description: `Created bot @${validation.username}`,
        },
      })
    }

    // Create bot record
    const isFirstBot = userBotCount === 0
    const bot = await tx.bot.create({
      data: {
        userId: ctx.user!.id,
        token,
        username: validation.username || '',
        firstName: validation.firstName || '',
        botId: validation.botId!,
        status: BotStatus.ACTIVE,
        isDefault: isFirstBot,
      },
    })

    return bot
  })

  // Start the bot asynchronously in the background (don't await)
  // This prevents the HTTP request from waiting for the bot to fully launch
  addBot({
    dbBotId: bot.id,
    token,
    userId: ctx.user!.id,
  }).catch((error) => {
    console.error('Failed to start bot in background:', error)
    // Bot created but failed to start - will be retried on health check or server restart
  })

  return bot
}

// Delete a bot
const deleteBot = async (ctx: RequestContext, botId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const bot = await db.bot.findFirst({
    where: {
      id: botId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!bot) {
    throw new NotFoundError('Bot not found')
  }

  // Remove from bot manager
  await removeBot(botId)

  // Soft delete
  await db.bot.update({
    where: { id: botId },
    data: {
      deletedAt: new Date(),
      status: BotStatus.INACTIVE,
    },
  })

  // If this was the default bot, set another as default
  if (bot.isDefault) {
    const anotherBot = await db.bot.findFirst({
      where: {
        userId: ctx.user.id,
        deletedAt: null,
        id: { not: botId },
      },
    })

    if (anotherBot) {
      await db.bot.update({
        where: { id: anotherBot.id },
        data: { isDefault: true },
      })
    }
  }

  return { success: true }
}

// Set a bot as default
const setDefault = async (ctx: RequestContext, botId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const bot = await db.bot.findFirst({
    where: {
      id: botId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!bot) {
    throw new NotFoundError('Bot not found')
  }

  // Remove default from all user's bots
  await db.bot.updateMany({
    where: {
      userId: ctx.user.id,
      deletedAt: null,
    },
    data: { isDefault: false },
  })

  // Set this bot as default
  await db.bot.update({
    where: { id: botId },
    data: { isDefault: true },
  })

  return { success: true }
}

// Sync bot chats - fetch all chats where bot is admin
const syncChats = async (ctx: RequestContext, botId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const bot = await db.bot.findFirst({
    where: {
      id: botId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!bot) {
    throw new NotFoundError('Bot not found')
  }

  // Import bot manager to get the bot instance
  const { getBot } = await import('../bot/bot-manager')
  const telegrafBot = getBot(botId)

  if (!telegrafBot) {
    throw new BadRequestError('Bot is not running')
  }

  // Note: Telegram Bot API doesn't have a direct method to get all chats
  // The bot needs to track chats as it receives updates
  // For now, we return existing entity links

  const entityLinks = await db.botTelegramEntity.findMany({
    where: { botId },
    include: {
      telegramEntity: true,
    },
  })

  return entityLinks
}

// Get chats for a bot
const getChats = async (ctx: RequestContext, botId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const bot = await db.bot.findFirst({
    where: {
      id: botId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!bot) {
    throw new NotFoundError('Bot not found')
  }

  const entityLinks = await db.botTelegramEntity.findMany({
    where: { botId },
    include: {
      telegramEntity: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return entityLinks
}

// Link a bot to a telegram entity
const linkToEntity = async (
  ctx: RequestContext,
  botId: string,
  telegramEntityId: string,
  isPrimary: boolean = false
) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  // Verify bot belongs to user
  const bot = await db.bot.findFirst({
    where: {
      id: botId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!bot) {
    throw new NotFoundError('Bot not found')
  }

  // Verify entity belongs to user
  const entity = await db.telegramEntity.findFirst({
    where: {
      id: telegramEntityId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!entity) {
    throw new NotFoundError('Telegram entity not found')
  }

  // Check bot permissions in the chat
  const { getBot } = await import('../bot/bot-manager')
  const telegrafBot = getBot(botId)

  let isAdmin = false
  let adminPermissions = null

  if (telegrafBot) {
    const chatMember = await telegrafBot.telegram
      .getChatMember(entity.telegramId, parseInt(bot.botId))
      .catch(() => null)

    if (chatMember && (chatMember.status === 'administrator' || chatMember.status === 'creator')) {
      isAdmin = true
      adminPermissions = chatMember.status === 'administrator' ? chatMember : null
    }
  }

  // If setting as primary, unset other primary bots for this entity
  if (isPrimary) {
    await db.botTelegramEntity.updateMany({
      where: {
        telegramEntityId,
        isPrimary: true,
      },
      data: { isPrimary: false },
    })
  }

  // Create or update link
  const link = await db.botTelegramEntity.upsert({
    where: {
      botId_telegramEntityId: {
        botId,
        telegramEntityId,
      },
    },
    update: {
      isAdmin,
      adminPermissions,
      isPrimary,
      syncedAt: new Date(),
    },
    create: {
      botId,
      telegramEntityId,
      isAdmin,
      adminPermissions,
      isPrimary,
    },
  })

  return link
}

// Unlink a bot from a telegram entity
const unlinkFromEntity = async (
  ctx: RequestContext,
  botId: string,
  telegramEntityId: string
) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  // Verify bot belongs to user
  const bot = await db.bot.findFirst({
    where: {
      id: botId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!bot) {
    throw new NotFoundError('Bot not found')
  }

  await db.botTelegramEntity.delete({
    where: {
      botId_telegramEntityId: {
        botId,
        telegramEntityId,
      },
    },
  })

  return { success: true }
}

// Get bot cost configuration
const getBotCostConfig = async () => {
  const config = await db.botCostConfig.findFirst({
    where: { isActive: true },
  })

  return config || { costPerBot: 0, freeBotsAllowed: 1 }
}

export default {
  list,
  getById,
  create,
  delete: deleteBot,
  setDefault,
  syncChats,
  getChats,
  linkToEntity,
  unlinkFromEntity,
  getBotCostConfig,
}
