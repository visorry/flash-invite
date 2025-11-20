import { Context, Telegraf } from 'telegraf'
import { registerStartCommand } from './commands/start'
import { handleChatMember } from './handlers/chat-member'

export function initBot(token: string): Telegraf {
  const bot = new Telegraf(token)

  // Register commands and handlers
  registerStartCommand(bot)

  // Handle chat member updates (detect unauthorized joins)
  bot.on('chat_member', handleChatMember)

  // Handle errors
  bot.catch((err: any) => {
    console.error('Telegram bot error:', err)
  })

  return bot
}
