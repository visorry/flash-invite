import Router from '../lib/router'
import type { Request } from 'express'
import subscriptionService from '../services/subscription.service'
import { getRequestContext } from '../helper/context'
import { z } from 'zod'

const router = Router()

export const name = 'subscriptions'

const SubscriptionParamsSchema = z.object({
    id: z.string().uuid(),
})

// Get active subscription
router.get(
    '/active',
    async (req: Request) => {
        const ctx = getRequestContext(req)
        if (!ctx.user) throw new Error('User not authenticated')
        return subscriptionService.getActiveSubscription(ctx.user.id)
    }
)

// Get subscription history
router.get(
    '/history',
    async (req: Request) => {
        const ctx = getRequestContext(req)
        if (!ctx.user) throw new Error('User not authenticated')
        return subscriptionService.getSubscriptionHistory(ctx.user.id)
    }
)

// Cancel subscription
router.post(
    '/:id/cancel',
    async (req: Request) => {
        const ctx = getRequestContext(req)
        if (!ctx.user) throw new Error('User not authenticated')
        const { id } = req.validatedParams
        return subscriptionService.cancelSubscription(ctx.user.id, id)
    },
    {
        validation: SubscriptionParamsSchema,
    }
)

export { router }
