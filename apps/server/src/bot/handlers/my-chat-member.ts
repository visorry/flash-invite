import { Context } from 'telegraf'
import db from '@super-invite/db'
import { TelegramEntityType } from '@super-invite/db'

/**
 * Handle my_chat_member updates - detect when bot is added/removed from chats
 * This tracks all groups/channels the bot is in
 */
export async function handleMyChatMember(ctx: Context) {
  if (!ctx.myChatMember) return

  const dbBotId = (ctx as any).dbBotId as string
  if (!dbBotId) {
    console.error('[MY_CHAT_MEMBER] No dbBotId in context')
    return
  }

  const chat = ctx.myChatMember.chat
  const oldStatus = ctx.myChatMember.old_chat_member.status
  const newStatus = ctx.myChatMember.new_chat_member.status

  // Get chat type
  let entityType: number
  if (chat.type === 'channel') {
    entityType = TelegramEntityType.CHANNEL
  } else if (chat.type === 'supergroup') {
    entityType = TelegramEntityType.SUPERGROUP
  } else if (chat.type === 'group') {
    entityType = TelegramEntityType.GROUP
  } else {
    // Private chat, ignore
    return
  }

  const chatId = chat.id.toString()
  const chatTitle = (chat as any).title || 'Unknown'
  const chatUsername = (chat as any).username || null

  console.log(`[MY_CHAT_MEMBER] Bot status changed in ${chatTitle}: ${oldStatus} -> ${newStatus}`)

  // Get the bot record to find userId
  const bot = await db.bot.findUnique({
    where: { id: dbBotId },
  })

  if (!bot) {
    console.error(`[MY_CHAT_MEMBER] Bot not found: ${dbBotId}`)
    return
  }

  // Bot was added to chat or promoted
  if (newStatus === 'administrator' || newStatus === 'member') {
    const isAdmin = newStatus === 'administrator'
    const adminPermissions = isAdmin ? ctx.myChatMember.new_chat_member : null

    // Find or create TelegramEntity for this user
    let entity = await db.telegramEntity.findFirst({
      where: {
        telegramId: chatId,
        userId: bot.userId,
      },
    })

    if (!entity) {
      // Create new entity
      entity = await db.telegramEntity.create({
        data: {
          userId: bot.userId,
          telegramId: chatId,
          type: entityType,
          title: chatTitle,
          username: chatUsername,
          isActive: true,
        },
      })
      console.log(`[MY_CHAT_MEMBER] Created TelegramEntity for ${chatTitle}`)
    } else {
      // Update existing entity
      await db.telegramEntity.update({
        where: { id: entity.id },
        data: {
          title: chatTitle,
          username: chatUsername,
          type: entityType,
          isActive: true,
        },
      })
    }

    // Create or update BotTelegramEntity link
    const existingLink = await db.botTelegramEntity.findUnique({
      where: {
        botId_telegramEntityId: {
          botId: dbBotId,
          telegramEntityId: entity.id,
        },
      },
    })

    // Check if this should be primary (first bot for this entity)
    const otherLinks = await db.botTelegramEntity.count({
      where: {
        telegramEntityId: entity.id,
        isPrimary: true,
      },
    })
    const shouldBePrimary = otherLinks === 0

    if (existingLink) {
      await db.botTelegramEntity.update({
        where: { id: existingLink.id },
        data: {
          isAdmin,
          adminPermissions: adminPermissions as any,
          syncedAt: new Date(),
          isPrimary: existingLink.isPrimary || shouldBePrimary,
        },
      })
    } else {
      await db.botTelegramEntity.create({
        data: {
          botId: dbBotId,
          telegramEntityId: entity.id,
          isAdmin,
          adminPermissions: adminPermissions as any,
          isPrimary: shouldBePrimary,
          syncedAt: new Date(),
        },
      })
    }

    console.log(`[MY_CHAT_MEMBER] Bot linked to ${chatTitle} (admin: ${isAdmin}, primary: ${shouldBePrimary})`)
  }

  // Bot was removed from chat
  if (newStatus === 'left' || newStatus === 'kicked') {
    // Find and remove the link
    const entity = await db.telegramEntity.findFirst({
      where: {
        telegramId: chatId,
        userId: bot.userId,
      },
    })

    if (entity) {
      await db.botTelegramEntity.deleteMany({
        where: {
          botId: dbBotId,
          telegramEntityId: entity.id,
        },
      })
      console.log(`[MY_CHAT_MEMBER] Bot unlinked from ${chatTitle}`)
    }
  }
}
