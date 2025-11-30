import { NotFoundError, BadRequestError, ConflictError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { TelegramEntityType } from '@super-invite/db'
import { telegramBot } from '../lib/telegram'
import { generatePrismaInclude } from '../helper/db/include'
import { DBEntity } from '../constant/db'

const list = async (ctx: RequestContext) => {
  const include = generatePrismaInclude(DBEntity.Bot, ctx)
  const filter = ctx.filter || {}
  const pagination = ctx.pagination || {}

  // Add user filter
  if (ctx.user) {
    filter.userId = ctx.user.id
  }

  const [items, total] = await Promise.all([
    db.telegramEntity.findMany({
      where: filter,
      ...(include && { include }),
      skip: pagination.skip,
      take: pagination.take,
      orderBy: pagination.orderBy || { createdAt: 'desc' },
    }),
    db.telegramEntity.count({ where: filter }),
  ])

  return {
    items,
    total,
    page: pagination.current || 1,
    size: pagination.take || 20,
  }
}

const getById = async (ctx: RequestContext, id: string) => {
  const entity = await db.telegramEntity.findUnique({
    where: { id },
    include: {
      botLinks: {
        include: {
          bot: {
            select: {
              id: true,
              username: true,
              firstName: true,
              status: true,
            },
          },
        },
      },
    },
  })

  if (!entity) {
    throw new NotFoundError('Telegram entity not found')
  }

  // Check ownership
  if (ctx.user && entity.userId !== ctx.user.id) {
    throw new NotFoundError('Telegram entity not found')
  }

  return entity
}

const create = async (ctx: RequestContext, data: {
  telegramId: string
  type: TelegramEntityType
  title: string
  username?: string
  description?: string
  botId?: string
}) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  // Check if entity already exists
  const existing = await db.telegramEntity.findUnique({
    where: {
      telegramId_userId: {
        telegramId: data.telegramId,
        userId: ctx.user.id
      }
    },
  })

  if (existing) {
    throw new ConflictError('This Telegram group/channel is already registered')
  }

  // Determine which bot to use for verification
  let botToUse = telegramBot // Default to platform bot
  let botIdToStore: string | null = null
  let customBotInstance: any = null

  if (data.botId && data.botId !== 'platform-bot') {
    // User selected a custom bot, verify they own it
    const userBot = await db.bot.findFirst({
      where: {
        id: data.botId,
        userId: ctx.user.id,
      },
    })

    if (!userBot) {
      throw new BadRequestError('Invalid bot selected or you do not have permission to use this bot')
    }

    // Get the bot instance from bot manager
    const { getBotInstance } = await import('../bot/bot-manager')
    const botInstance = getBotInstance(userBot.id)

    if (!botInstance) {
      throw new BadRequestError('Selected bot is not running. Please start the bot first.')
    }

    customBotInstance = botInstance
    botIdToStore = userBot.id
  }

  // Verify bot has access to the chat
  try {
    let chat: any
    let isAdmin: boolean
    let memberCount: number

    if (customBotInstance) {
      // Using custom bot (Telegraf instance)
      chat = await customBotInstance.bot.telegram.getChat(data.telegramId)

      // Check if bot is admin - use the telegramBotId from BotInstance
      const botMember = await customBotInstance.bot.telegram.getChatMember(
        data.telegramId,
        parseInt(customBotInstance.telegramBotId)
      )
      isAdmin = ['administrator', 'creator'].includes(botMember.status)

      // Note: Telegraf uses getChatMembersCount (with 's')
      memberCount = await customBotInstance.bot.telegram.getChatMembersCount(data.telegramId)
    } else {
      // Using platform bot (TelegramBotClient)
      chat = await botToUse.getChat(data.telegramId)
      isAdmin = await botToUse.isBotAdmin(data.telegramId)
      memberCount = await botToUse.getChatMemberCount(data.telegramId)
    }

    if (!isAdmin) {
      throw new BadRequestError('Bot must be an admin in the group/channel')
    }

    // Create entity
    const entity = await db.telegramEntity.create({
      data: {
        userId: ctx.user.id,
        telegramId: data.telegramId,
        type: data.type,
        title: data.title || chat.title || 'Unknown',
        username: data.username || chat.username,
        description: data.description || chat.description,
        memberCount,
        isActive: true,
      },
    })

    // Create bot-entity link if a specific bot was used
    if (botIdToStore) {
      await db.botTelegramEntity.create({
        data: {
          botId: botIdToStore,
          telegramEntityId: entity.id,
          isAdmin: true,
          isPrimary: true, // This is the primary bot for this entity
        },
      })
    }

    // Send welcome message to the group/channel
    try {
      const chatType = data.type === 0 ? 'Group' : data.type === 1 ? 'Supergroup' : 'Channel'
      const welcomeMessage = `🎉 *Welcome to ${chat.title || data.title}!*

📋 *Chat Information:*
• Chat ID: \`${data.telegramId}\`
• Type: ${chatType}
• Members: ${memberCount}

✨ *What's Next?*
You can now manage this ${chatType.toLowerCase()} from your dashboard:
• 🔗 Create auto-expiring invite links
• ⚡ Set up auto-approval rules
• 📊 Track member analytics
• 🔄 Configure forward rules
• 📢 And much more!

🌐 Visit your dashboard to get started and unlock all features!

_Bot successfully connected and ready to use._`

      if (customBotInstance) {
        // Send using custom bot
        await customBotInstance.bot.telegram.sendMessage(data.telegramId, welcomeMessage, {
          parse_mode: 'Markdown',
        })
      } else {
        // Send using platform bot
        await botToUse.sendMessage(data.telegramId, welcomeMessage)
      }
    } catch (messageError) {
      // Don't fail if message sending fails, just log it
      console.error('Failed to send welcome message:', messageError)
    }

    return entity
  } catch (error: any) {
    if (error instanceof BadRequestError || error instanceof ConflictError) {
      throw error
    }
    throw new BadRequestError(`Failed to verify Telegram group/channel: ${error.message}`)
  }
}

const update = async (ctx: RequestContext, id: string, data: {
  title?: string
  username?: string
  description?: string
  isActive?: boolean
}) => {
  await getById(ctx, id)

  const updated = await db.telegramEntity.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  })

  return updated
}

const deleteEntity = async (ctx: RequestContext, id: string) => {
  await getById(ctx, id)

  // Check if there are active invite links
  const activeInvites = await db.inviteLink.count({
    where: {
      telegramEntityId: id,
      status: 0, // ACTIVE
    },
  })

  if (activeInvites > 0) {
    throw new ConflictError('Cannot delete entity with active invite links')
  }

  await db.telegramEntity.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  })
}

const syncMemberCount = async (ctx: RequestContext, id: string) => {
  const entity = await db.telegramEntity.findUnique({
    where: { id },
    include: {
      botLinks: {
        where: { isPrimary: true },
        include: { bot: true },
      },
    },
  })

  if (!entity) {
    throw new NotFoundError('Telegram entity not found')
  }

  // Check ownership
  if (ctx.user && entity.userId !== ctx.user.id) {
    throw new NotFoundError('Telegram entity not found')
  }

  // Get the primary bot for this entity
  const primaryBotLink = entity.botLinks[0]
  if (!primaryBotLink) {
    throw new BadRequestError('No bot is linked to this entity. Please link a bot first.')
  }

  // Import bot manager to get the bot instance
  const { getBot } = await import('../bot/bot-manager')
  const bot = getBot(primaryBotLink.botId)

  if (!bot) {
    throw new BadRequestError('Bot is not running. Please check bot status.')
  }

  try {
    const memberCount = await bot.telegram.getChatMembersCount(entity.telegramId)

    const updated = await db.telegramEntity.update({
      where: { id },
      data: {
        memberCount,
        updatedAt: new Date(),
      },
    })

    return updated
  } catch (error: any) {
    throw new BadRequestError(`Failed to sync member count: ${error.message}`)
  }
}

export default {
  list,
  getById,
  create,
  update,
  delete: deleteEntity,
  syncMemberCount,
}
