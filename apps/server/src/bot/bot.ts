import { Context, Telegraf } from 'telegraf'
import { registerStartCommand } from './commands/start'
import { handleChatMember } from './handlers/chat-member'
import { handleMyChatMember } from './handlers/my-chat-member'
import { handleChannelPost, handleGroupMessage } from './handlers/channel-post'
import { setupChatJoinRequestHandler } from './handlers/chat-join-request'

export function initBot(token: string, dbBotId: string): Telegraf {
  const bot = new Telegraf(token)

  // Store dbBotId in bot context for handlers to access
  bot.use((ctx, next) => {
    ;(ctx as any).dbBotId = dbBotId
    return next()
  })

  // Register commands and handlers
  registerStartCommand(bot)

  // Handle chat member updates (detect unauthorized joins)
  bot.on('chat_member', handleChatMember)

  // Handle bot's own status changes (added/removed from chats)
  bot.on('my_chat_member', handleMyChatMember)

  // Handle channel posts for forwarding
  bot.on('channel_post', handleChannelPost)

  // Handle group messages for forwarding
  bot.on('message', handleGroupMessage)

  // Handle chat join requests for auto-approval
  setupChatJoinRequestHandler(bot, dbBotId)

  // Handle errors
  bot.catch((err: any) => {
    console.error(`Telegram bot error (${dbBotId}):`, err)
  })

  return bot
}
