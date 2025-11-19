import Router from '../lib/router'
import type { Request } from 'express'
import { botManager } from '../bot'

const router = Router()

export const name = 'bot'

/**
 * GET /bot/status
 * Get bot status and information
 */
router.get(
  '/status',
  async (_req: Request) => {
    const bot = botManager.getDefaultBot()
    
    if (!bot) {
      return {
        status: 'offline',
        message: 'Bot is not initialized',
      }
    }

    try {
      const botInfo = await bot.telegram.getMe()
      const stats = botManager.getStats()
      
      return {
        status: 'online',
        bot: {
          id: botInfo.id,
          username: botInfo.username,
          firstName: botInfo.first_name,
        },
        stats,
      }
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message,
      }
    }
  }
)

export { router }
