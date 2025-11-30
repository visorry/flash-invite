import Router from '../lib/router'
import type { Request } from 'express'
import db from '@super-invite/db'

const router = Router()

export const name = 'config'

// Get public configuration (non-sensitive data only)
router.get(
  '/public',
  async (_req: Request) => {
    const configs = await db.config.findMany({
      where: {
        key: {
          in: ['botUsername'],
        },
      },
    })

    const configMap: any = {
      botUsername: '',
    }

    configs.forEach((config) => {
      configMap[config.key] = config.value
    })

    return {
      botUsername: configMap.botUsername || null,
    }
  }
)

export { router }
