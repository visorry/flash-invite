import { Telegraf } from 'telegraf'

export function registerHelpCommand(bot: Telegraf) {
  bot.help(async (ctx) => {
    const message = '🤖 *Bot Commands*\n\n' +
      '📋 *Available Commands:*\n\n' +
      '🔗 `/start <token>` - Join a group using an invite link\n' +
      '📮 `/post` - Get next batch of posts immediately\n' +
      '🛑 `/stop` - Show auto drop information\n' +
      '❓ `/help` - Show this help message\n\n' +
      '💡 *How Auto Drop Works:*\n' +
      'Type `/post` anytime to receive the next batch of posts from configured source groups. ' +
      'Each time you use `/post`, you\'ll get new posts immediately - no subscription needed!\n\n' +
      '🔗 *Group Access:*\n' +
      'Use `/start` with your unique invite token to join private groups.'

    await ctx.reply(message, { parse_mode: 'Markdown' })
  })

  // Also handle /help command explicitly
  bot.command('help', async (ctx) => {
    const message = '🤖 *Bot Commands*\n\n' +
      '📋 *Available Commands:*\n\n' +
      '🔗 `/start <token>` - Join a group using an invite link\n' +
      '📮 `/post` - Get next batch of posts immediately\n' +
      '🛑 `/stop` - Show auto drop information\n' +
      '❓ `/help` - Show this help message\n\n' +
      '💡 *How Auto Drop Works:*\n' +
      'Type `/post` anytime to receive the next batch of posts from configured source groups. ' +
      'Each time you use `/post`, you\'ll get new posts immediately - no subscription needed!\n\n' +
      '🔗 *Group Access:*\n' +
      'Use `/start` with your unique invite token to join private groups.'

    await ctx.reply(message, { parse_mode: 'Markdown' })
  })
}