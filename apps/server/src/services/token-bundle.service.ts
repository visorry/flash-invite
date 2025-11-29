import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db, { PaymentStatus, PaymentType, TransactionType } from '@super-invite/db'
import cashfreeService from './cashfree.service'

const getActiveBundles = async () => {
    return db.tokenBundle.findMany({
        where: {
            isActive: true,
            deletedAt: null
        },
        orderBy: { price: 'asc' },
    })
}

const purchaseBundle = async (ctx: RequestContext, bundleId: string) => {
    if (!ctx.user) {
        throw new BadRequestError('User not authenticated')
    }

    const bundle = await db.tokenBundle.findUnique({
        where: { id: bundleId },
    })

    if (!bundle) {
        throw new NotFoundError('Token bundle not found')
    }

    if (!bundle.isActive || bundle.deletedAt) {
        throw new BadRequestError('Token bundle is not available')
    }

    // Create local payment order
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tokens?order_id={order_id}`

    const paymentOrder = await db.paymentOrder.create({
        data: {
            userId: ctx.user.id,
            orderId,
            amount: bundle.price,
            status: PaymentStatus.PENDING,
            type: PaymentType.TOKEN_BUNDLE,
            referenceId: bundleId,
        },
    })

    // Create Cashfree order
    const cashfreeOrder = await cashfreeService.createOrder({
        orderId,
        amount: bundle.price,
        currency: 'INR',
        customerId: ctx.user.id,
        customerEmail: ctx.user.email,
        customerPhone: '9999999999', // Placeholder
        returnUrl,
    })

    // Update payment session ID
    await db.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: {
            paymentSessionId: cashfreeOrder.payment_session_id,
        },
    })

    return {
        paymentSessionId: cashfreeOrder.payment_session_id,
        orderId,
    }
}

export default {
    getActiveBundles,
    purchaseBundle,
}
