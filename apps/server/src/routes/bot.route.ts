import Router from '../lib/router'
import type { Request } from 'express'
import { handleStartCommand } from '../bot'

const router = Router()

export const name = 'bot'

/**
 * POST /bot/webhook
 * Telegram bot webhook endpoint
 */
router.post(
  '/webhook',
  async (req: Request) => {
    const update = req.body

    // Handle /start command
    if (update.message?.text?.startsWith('/start')) {
      const text = update.message.text
      const parts = text.split(' ')
      const token = parts[1] // Token after /start

      const user = update.message.from
      const result = await handleStartCommand({
        userId: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        token,
      })

      // Send response back to user
      // Note: In production, you'd use the Telegram Bot API to send messages
      // For now, we'll just return the result
      return result
    }

    return { ok: true }
  }
)

/**
 * GET /bot/start/:token
 * Handle start command via HTTP (for testing)
 */
router.get(
  '/start/:token',
  async (req: Request) => {
    const { token } = req.params
    const { userId, username, firstName, lastName } = req.query

    if (!userId) {
      return { error: 'userId is required' }
    }

    const result = await handleStartCommand({
      userId: parseInt(userId as string),
      username: username as string,
      firstName: firstName as string,
      lastName: lastName as string,
      token,
    })

    return result
  }
)

export { router }
