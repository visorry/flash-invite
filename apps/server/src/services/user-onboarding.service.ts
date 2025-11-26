import db, { SubscriptionStatus } from '@super-invite/db'

/**
 * Assigns a free tier subscription to a new user
 * This should be called when a user account is created
 */
const assignFreeTier = async (userId: string) => {
    // Find the free plan (assuming it has price = 0 and name contains "Free")
    const freePlan = await db.plan.findFirst({
        where: {
            price: 0,
            isActive: true,
            deletedAt: null,
        },
        orderBy: {
            createdAt: 'asc', // Get the oldest free plan
        },
    })

    if (!freePlan) {
        console.warn('No free plan found! User will not have a subscription.')
        return null
    }

    // Check if user already has a subscription
    const existingSub = await db.subscription.findFirst({
        where: { userId },
    })

    if (existingSub) {
        console.log(`User ${userId} already has a subscription`)
        return existingSub
    }

    // Create free tier subscription (lifetime)
    const subscription = await db.subscription.create({
        data: {
            userId,
            planId: freePlan.id,
            status: SubscriptionStatus.ACTIVE,
            startDate: new Date(),
            endDate: null, // Lifetime/no expiry for free tier
            autoRenew: false, // Free tier doesn't auto-renew
            metadata: {
                createdVia: 'AUTO_ASSIGNED',
                tier: 'FREE',
            },
        },
    })

    console.log(`Assigned free tier subscription to user ${userId}`)
    return subscription
}

export default {
    assignFreeTier,
}
