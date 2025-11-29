import Router from '../lib/router'
import type { Request } from 'express'
import db from '@super-invite/db'

const router = Router()

export const name = 'plans'

// Get all active plans (public endpoint)
router.get(
    '/',
    async (_req: Request) => {
        const plans = await db.plan.findMany({
            where: {
                deletedAt: null,
                isActive: true,
            },
            orderBy: { price: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
                type: true,
                interval: true,
                price: true,
                tokensIncluded: true,
                maxGroups: true,
                maxInvitesPerDay: true,
                features: true,
                isActive: true,
            },
        })

        return plans
    }
)

export { router }
