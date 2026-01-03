import { Context, Telegraf } from 'telegraf'
import { registerStartCommand } from './commands/start'
import { handleChatMember } from './handlers/chat-member'
import { handleMyChatMember } from './handlers/my-chat-member'
import { handleChannelPost, handleGroupMessage } from './handlers/channel-post'
import { setupChatJoinRequestHandler } from './handlers/chat-join-request'
import { handleAutoDropCommand, getAutoDropCommands } from './handlers/auto-drop'

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

  // Handle group/private messages for forwarding and auto-drop commands
  bot.on('message', async (ctx, next) => {
    // Check for auto-drop commands first (only in private chats)
    if (ctx.chat?.type === 'private' && ctx.message && 'text' in ctx.message) {
      const text = ctx.message.text
      console.log(`[BOT] Private message received: ${text}`)
      if (text.startsWith('/')) {
        const command = text.split(' ')[0].split('@')[0] // Extract command without bot username
        console.log(`[BOT] Command detected: ${command}`)
        const handled = await handleAutoDropCommand(ctx, command)
        if (handled) return
      }
    }
    
    // Then handle group message forwarding
    await handleGroupMessage(ctx)
  })

  // Handle chat join requests for auto-approval
  setupChatJoinRequestHandler(bot, dbBotId)

  // Handle errors
  bot.catch((err: any) => {
    console.error(`Telegram bot error (${dbBotId}):`, err)
  })

  return bot
}
