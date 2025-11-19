import { Telegraf } from 'telegraf'
import db from '@super-invite/db'
import { initBot } from './bot'

class BotManager {
  private defaultBot: Telegraf | null = null

  async initializeDefaultBot(): Promise<void> {
    try {
      // Get default bot token from config
      const botConfig = await db.config.findUnique({
        where: { key: 'botToken' },
      })

      const botToken = botConfig?.value || process.env.TELEGRAM_BOT_TOKEN

      if (!botToken) {
        console.error('No default bot token found in config or environment')
        return
      }

      if (!this.defaultBot) {
        console.log('Initializing default bot...')
        this.defaultBot = initBot(botToken)
        
        // Start bot with long polling
        await this.defaultBot.launch()
        console.log('Default bot initialized and launched successfully')
      }
    } catch (error) {
      console.error('Failed to initialize default bot:', error)
      throw error
    }
  }

  async initializeCustomBots(): Promise<void> {
    // TODO: Implement custom bots when Bot model is added to schema
    console.log('Custom bots not yet implemented')
  }

  getDefaultBot(): Telegraf | null {
    return this.defaultBot
  }

  async healthCheck(): Promise<void> {
    console.log('Performing bot health check...')

    // Check default bot
    if (this.defaultBot) {
      try {
        const botInfo = await this.defaultBot.telegram.getMe()
        console.log(`Bot health check passed: @${botInfo.username}`)
      } catch (error) {
        console.error('Default bot health check failed:', error)
      }
    }
  }

  getStats() {
    return {
      defaultBot: !!this.defaultBot,
      customBots: 0,
      totalBots: this.defaultBot ? 1 : 0,
    }
  }

  async stop(): Promise<void> {
    console.log('Stopping all bots...')
    
    if (this.defaultBot) {
      await this.defaultBot.stop()
    }

    this.defaultBot = null
    console.log('All bots stopped')
  }
}

export const botManager = new BotManager()
