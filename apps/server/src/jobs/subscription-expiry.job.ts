import db, { SubscriptionStatus } from '@super-invite/db'
import userOnboardingService from '../services/user-onboarding.service'

/**
 * Background job to check for expired subscriptions and handle them
 * Should be run periodically (e.g., every hour or daily)
 */
export const checkExpiredSubscriptions = async () => {
    console.log('[SUBSCRIPTION_EXPIRY] Checking for expired subscriptions...')

    const now = new Date()

    // Find all active subscriptions that have expired
    const expiredSubscriptions = await db.subscription.findMany({
        where: {
            status: SubscriptionStatus.ACTIVE,
            endDate: {
                not: null,
                lte: now, // End date is in the past
            },
        },
        include: {
            user: true,
            plan: true,
        },
    })

    console.log(`[SUBSCRIPTION_EXPIRY] Found ${expiredSubscriptions.length} expired subscriptions`)

    for (const subscription of expiredSubscriptions) {
        try {
            console.log(`[SUBSCRIPTION_EXPIRY] Processing expired subscription ${subscription.id} for user ${subscription.userId}`)

            // Mark subscription as expired
            await db.subscription.update({
                where: { id: subscription.id },
                data: {
                    status: SubscriptionStatus.EXPIRED,
                    autoRenew: false,
                },
            })

            // Check if user has any other active subscription
            const otherActiveSub = await db.subscription.findFirst({
                where: {
                    userId: subscription.userId,
                    status: SubscriptionStatus.ACTIVE,
                    id: { not: subscription.id },
                },
            })

            if (!otherActiveSub) {
                // User has no active subscription, assign free tier
                console.log(`[SUBSCRIPTION_EXPIRY] User ${subscription.userId} has no active subscription, assigning free tier`)
                await userOnboardingService.assignFreeTier(subscription.userId)
            }

            console.log(`[SUBSCRIPTION_EXPIRY] Successfully processed subscription ${subscription.id}`)
        } catch (error) {
            console.error(`[SUBSCRIPTION_EXPIRY] Error processing subscription ${subscription.id}:`, error)
        }
    }

    console.log('[SUBSCRIPTION_EXPIRY] Completed expired subscriptions check')
    return {
        processed: expiredSubscriptions.length,
        timestamp: now,
    }
}
