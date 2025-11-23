import Router from '../lib/router'
import type { Request } from 'express'
import { getAllBots, getStats, healthCheck } from '../bot/bot-manager'

const router = Router()

export const name = 'bot'

// GET /bot/status - Get overall bot system status
router.get(
  '/status',
  async (_req: Request) => {
    const allBots = getAllBots()
    const stats = getStats()

    if (allBots.length === 0) {
      return {
        status: 'offline',
        message: 'No bots are running',
        stats,
      }
    }

    const botStatuses = await Promise.all(
      allBots.map(async (instance) => {
        const botInfo = await instance.bot.telegram.getMe().catch(() => null)
        return {
          id: instance.dbBotId,
          username: instance.username,
          status: botInfo ? 'online' : 'error',
        }
      })
    )

    return {
      status: 'online',
      bots: botStatuses,
      stats,
    }
  }
)

// POST /bot/health-check - Trigger health check
router.post(
  '/health-check',
  async (_req: Request) => {
    await healthCheck()
    return {
      message: 'Health check completed',
      stats: getStats(),
    }
  }
)

export { router }
