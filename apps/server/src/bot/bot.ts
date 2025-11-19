import { Context, Telegraf } from 'telegraf'
import { registerStartCommand } from './commands/start'

export function initBot(token: string): Telegraf {
  const bot = new Telegraf(token)

  // Register commands and handlers
  registerStartCommand(bot)

  // Handle errors
  bot.catch((err: any) => {
    console.error('Telegram bot error:', err)
  })

  return bot
}
