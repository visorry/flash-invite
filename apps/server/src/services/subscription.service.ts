import { NotFoundError, BadRequestError } from '../errors/http-exception'
import db, { SubscriptionStatus } from '@super-invite/db'

const getActiveSubscription = async (userId: string) => {
    return db.subscription.findFirst({
        where: {
            userId,
            status: SubscriptionStatus.ACTIVE,
            deletedAt: null,
        },
        include: {
            plan: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    })
}

const getSubscriptionHistory = async (userId: string) => {
    return db.subscription.findMany({
        where: {
            userId,
            deletedAt: null,
        },
        include: {
            plan: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    })
}

const cancelSubscription = async (userId: string, subscriptionId: string) => {
    const subscription = await db.subscription.findFirst({
        where: {
            id: subscriptionId,
            userId,
            deletedAt: null,
        },
    })

    if (!subscription) {
        throw new NotFoundError('Subscription not found')
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
        throw new BadRequestError('Subscription is not active')
    }

    return db.subscription.update({
        where: { id: subscriptionId },
        data: {
            status: SubscriptionStatus.CANCELLED,
            cancelledAt: new Date(),
            autoRenew: false,
        },
    })
}

const checkSubscriptionStatus = async (userId: string) => {
    const subscription = await getActiveSubscription(userId)

    if (!subscription) {
        return { hasActiveSubscription: false, subscription: null }
    }

    // Check if subscription has expired
    if (subscription.endDate && subscription.endDate < new Date()) {
        // Mark as expired
        await db.subscription.update({
            where: { id: subscription.id },
            data: { status: SubscriptionStatus.EXPIRED },
        })
        return { hasActiveSubscription: false, subscription: null }
    }

    return { hasActiveSubscription: true, subscription }
}

export default {
    getActiveSubscription,
    getSubscriptionHistory,
    cancelSubscription,
    checkSubscriptionStatus,
}
