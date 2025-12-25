import { Telegraf } from 'telegraf'
import db from '@super-invite/db'

export function registerStopCommand(bot: Telegraf) {
  bot.command('stop', async (ctx) => {
    try {
      const userId = ctx.from.id.toString()
      const fullName = [ctx.from.first_name, ctx.from.last_name]
        .filter(Boolean)
        .join(' ')

      // Get botId from context (set by middleware in bot.ts)
      const dbBotId = (ctx as any).dbBotId as string

      if (!dbBotId) {
        return ctx.reply('❌ Bot configuration error. Please contact support.')
      }

      // Update bot member last active time
      await db.botMember.updateMany({
        where: {
          botId: dbBotId,
          telegramUserId: userId,
        },
        data: {
          lastActiveAt: new Date(),
        },
      })

      const message = '🛑 *Auto Drop Information*\n\n' +
        `${fullName}, the /post command works on-demand.\n\n` +
        '📮 Each time you type /post, you\'ll receive the next batch of posts immediately.\n\n' +
        '🔄 There\'s no subscription to stop - just use /post when you want posts!\n\n' +
        '💡 *Available Commands:*\n' +
        '• /post - Get next batch of posts\n' +
        '• /help - Show all commands'

      await ctx.reply(message, { parse_mode: 'Markdown' })

      console.log(`[STOP_COMMAND] User ${userId} (${fullName}) used /stop command for bot ${dbBotId}`)

    } catch (error) {
      console.error('Error in /stop command:', error)
      await ctx.reply('❌ Something went wrong. Please try again later.')
    }
  })
}