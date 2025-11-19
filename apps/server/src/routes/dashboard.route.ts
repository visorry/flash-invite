import Router from '../lib/router'
import type { Request } from 'express'
import dashboardService from '../services/dashboard.service'
import { getRequestContext } from '../helper/context'

const router = Router()

export const name = 'dashboard'

router.get(
  '/stats',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return dashboardService.getStats(ctx)
  }
)

router.get(
  '/recent-activity',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return dashboardService.getRecentActivity(ctx)
  }
)

export { router }
