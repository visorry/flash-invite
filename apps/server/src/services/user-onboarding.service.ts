import db, { SubscriptionStatus, TransactionType, TransactionStatus } from '@super-invite/db'

const WELCOME_BONUS_TOKENS = 100

/**
 * Grants welcome bonus tokens to a new user
 */
const grantWelcomeBonus = async (userId: string) => {
    // Check if user already received welcome bonus
    const existingBonus = await db.tokenTransaction.findFirst({
        where: {
            userId,
            type: TransactionType.WELCOME_BONUS,
        },
    })

    if (existingBonus) {
        console.log(`User ${userId} already received welcome bonus`)
        return null
    }

    // Get or create token balance
    let balance = await db.tokenBalance.findUnique({
        where: { userId },
    })

    if (!balance) {
        balance = await db.tokenBalance.create({
            data: {
                userId,
                balance: 0,
                totalEarned: 0,
                totalSpent: 0,
            },
        })
    }

    const newBalance = balance.balance + WELCOME_BONUS_TOKENS

    // Update balance
    await db.tokenBalance.update({
        where: { userId },
        data: {
            balance: newBalance,
            totalEarned: { increment: WELCOME_BONUS_TOKENS },
        },
    })

    // Create transaction record
    const transaction = await db.tokenTransaction.create({
        data: {
            userId,
            type: TransactionType.WELCOME_BONUS,
            status: TransactionStatus.COMPLETED,
            amount: WELCOME_BONUS_TOKENS,
            balanceAfter: newBalance,
            description: 'Welcome bonus for new account',
        },
    })

    console.log(`Granted ${WELCOME_BONUS_TOKENS} welcome bonus tokens to user ${userId}`)
    return transaction
}

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
    grantWelcomeBonus,
}
