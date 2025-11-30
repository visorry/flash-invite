import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db, { PaymentStatus, PaymentType, TransactionType, PaymentGateway } from '@super-invite/db'
import cashfreeService from './cashfree.service'
import phonePeService from './phonepe.service'
import paymentGatewayConfigService from './payment-gateway-config.service'
import tokenService from './token.service'
import emailService from './email.service'
import { withTransaction } from '../helper/db/transaction'

const createOrder = async (
    ctx: RequestContext,
    referenceId: string,
    type: PaymentType,
    phoneNumber?: string
) => {
    if (!ctx.user) {
        throw new BadRequestError('User not authenticated')
    }

    let amount = 0
    let description = ''
    let returnUrl = ''

    // Validate reference and calculate amount
    if (type === PaymentType.SUBSCRIPTION) {
        const plan = await db.plan.findUnique({
            where: { id: referenceId },
        })
        if (!plan) throw new NotFoundError('Plan not found')
        amount = plan.price
        description = `Subscription: ${plan.name}`
        returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?order_id={order_id}`
    } else if (type === PaymentType.TOKEN_BUNDLE) {
        const bundle = await db.tokenBundle.findUnique({
            where: { id: referenceId },
        })
        if (!bundle) throw new NotFoundError('Token bundle not found')
        amount = bundle.price
        description = `Token Bundle: ${bundle.name}`
        returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tokens?order_id={order_id}`
    } else {
        throw new BadRequestError('Invalid payment type')
    }

    // Get active payment gateway
    const gatewayConfig = await paymentGatewayConfigService.getActiveGateway()

    // Create local payment order
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const paymentOrder = await db.paymentOrder.create({
        data: {
            userId: ctx.user.id,
            orderId,
            amount,
            status: PaymentStatus.PENDING,
            type,
            referenceId,
        },
    })

    let paymentSessionId: string | undefined
    let redirectUrl: string | undefined

    // Create order with appropriate gateway
    if (gatewayConfig.gateway === PaymentGateway.PHONEPE) {
        const phonePeOrder = await phonePeService.createOrder({
            orderId,
            amount,
            customerId: ctx.user.id,
            customerEmail: ctx.user.email,
            customerPhone: phoneNumber || (ctx.user as any).phoneNumber || '9999999999',
            returnUrl,
            callbackUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/webhook`,
        })

        if (phonePeOrder.success && phonePeOrder.data.instrumentResponse?.redirectInfo) {
            redirectUrl = phonePeOrder.data.instrumentResponse.redirectInfo.url
            paymentSessionId = phonePeOrder.data.merchantTransactionId
        } else {
            throw new BadRequestError('PhonePe order creation failed')
        }
    } else {
        // Default to Cashfree
        const cashfreeOrder = await cashfreeService.createOrder({
            orderId,
            amount,
            currency: 'INR',
            customerId: ctx.user.id,
            customerEmail: ctx.user.email,
            customerPhone: phoneNumber || (ctx.user as any).phoneNumber || '9999999999',
            returnUrl,
        })

        paymentSessionId = cashfreeOrder.payment_session_id
    }

    // Update payment session ID
    await db.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: {
            paymentSessionId,
        },
    })

    return {
        paymentSessionId,
        orderId,
        redirectUrl,
        gateway: gatewayConfig.gateway,
    }
}

const verifyPayment = async (orderId: string) => {
    const paymentOrder = await db.paymentOrder.findUnique({
        where: { orderId },
        include: { user: true },
    })

    if (!paymentOrder) {
        throw new NotFoundError('Payment order not found')
    }

    // IDEMPOTENCY: If already processed successfully, return immediately
    if (paymentOrder.status === PaymentStatus.SUCCESS) {
        console.log(`Order ${orderId} already processed successfully`)
        return { status: 'ALREADY_PAID', orderId }
    }

    // IDEMPOTENCY: If already marked as failed, don't reprocess
    if (paymentOrder.status === PaymentStatus.FAILED) {
        console.log(`Order ${orderId} already marked as failed`)
        return { status: 'FAILED', orderId }
    }

    // Get active payment gateway to determine which service to use
    const gatewayConfig = await paymentGatewayConfigService.getActiveGateway()

    let paymentSuccess = false

    // Fetch status from appropriate gateway
    if (gatewayConfig.gateway === PaymentGateway.PHONEPE) {
        const phonePeStatus = await phonePeService.getOrderStatus(orderId)
        paymentSuccess = phonePeStatus.success && phonePeStatus.data.state === 'COMPLETED'

        if (phonePeStatus.data.state === 'FAILED') {
            await db.paymentOrder.update({
                where: { id: paymentOrder.id },
                data: { status: PaymentStatus.FAILED },
            })
            return { status: 'FAILED', orderId }
        }
    } else {
        const cfOrder = await cashfreeService.getOrder(orderId)
        paymentSuccess = cfOrder.order_status === 'PAID'

        if (cfOrder.order_status === 'FAILED') {
            await db.paymentOrder.update({
                where: { id: paymentOrder.id },
                data: { status: PaymentStatus.FAILED },
            })
            return { status: 'FAILED', orderId }
        }
    }

    if (paymentSuccess) {
        // Process successful payment
        const txResult = await withTransaction({} as any, async (tx) => { // Using empty context for system action
            // 1. Update Payment Order
            // Atomic update to prevent double-spending
            const updateResult = await tx.paymentOrder.updateMany({
                where: {
                    id: paymentOrder.id,
                    status: PaymentStatus.PENDING
                },
                data: { status: PaymentStatus.SUCCESS },
            })

            if (updateResult.count === 0) {
                console.log(`Order ${orderId} skipped - already processed (race condition)`)
                return { updated: false }
            }

            // 2. Fulfill Order
            if (paymentOrder.type === PaymentType.TOKEN_BUNDLE) {
                const bundle = await tx.tokenBundle.findUnique({
                    where: { id: paymentOrder.referenceId! },
                })

                if (bundle) {
                    // Get or create balance
                    let balance = await tx.tokenBalance.findUnique({
                        where: { userId: paymentOrder.userId },
                    })

                    if (!balance) {
                        balance = await tx.tokenBalance.create({
                            data: {
                                userId: paymentOrder.userId,
                                balance: 0,
                                totalEarned: 0,
                                totalSpent: 0,
                            },
                        })
                    }

                    const newBalance = balance.balance + bundle.tokens

                    await tx.tokenBalance.update({
                        where: { userId: paymentOrder.userId },
                        data: {
                            balance: newBalance,
                            totalEarned: { increment: bundle.tokens },
                        },
                    })

                    await tx.tokenTransaction.create({
                        data: {
                            userId: paymentOrder.userId,
                            type: TransactionType.PURCHASE,
                            status: 1, // COMPLETED
                            amount: bundle.tokens,
                            balanceAfter: newBalance,
                            description: `Purchased ${bundle.name}`,
                            reference: paymentOrder.orderId,
                        },
                    })
                }
            } else if (paymentOrder.type === PaymentType.SUBSCRIPTION) {
                const plan = await tx.plan.findUnique({
                    where: { id: paymentOrder.referenceId! },
                })

                if (!plan) {
                    console.error(`Plan ${paymentOrder.referenceId} not found`)
                    return { updated: true }
                }

                // Check if subscription already exists for this payment order (idempotency)
                const existingSubForOrder = await tx.subscription.findFirst({
                    where: {
                        userId: paymentOrder.userId,
                        metadata: {
                            path: ['orderId'],
                            equals: paymentOrder.orderId
                        }
                    }
                })

                if (existingSubForOrder) {
                    console.log(`Subscription already created for order ${paymentOrder.orderId}`)
                    return { updated: true } // Skip duplicate creation
                }

                // Get current active subscription
                const activeSub = await tx.subscription.findFirst({
                    where: {
                        userId: paymentOrder.userId,
                        status: 0, // ACTIVE
                    },
                    include: {
                        plan: true,
                    }
                })

                const now = new Date()
                let startDate = now
                let endDate: Date | null = new Date()

                // Calculate end date based on interval
                const calculateEndDate = (start: Date, interval: number): Date | null => {
                    const end = new Date(start)
                    if (interval === 0) { // MONTHLY
                        end.setMonth(end.getMonth() + 1)
                        return end
                    } else if (interval === 1) { // YEARLY
                        end.setFullYear(end.getFullYear() + 1)
                        return end
                    }
                    return null // LIFETIME
                }

                if (activeSub) {
                    // Check if it's the same plan (stacking) or different plan (upgrade)
                    if (activeSub.planId === plan.id) {
                        // STACKING: Same plan - extend the end date
                        console.log(`Stacking subscription for user ${paymentOrder.userId}, plan ${plan.id}`)

                        // Start from current end date (or now if expired)
                        const currentEndDate = activeSub.endDate || now
                        startDate = currentEndDate > now ? currentEndDate : now
                        endDate = calculateEndDate(startDate, plan.interval)

                        // Update existing subscription's end date
                        await tx.subscription.update({
                            where: { id: activeSub.id },
                            data: {
                                endDate,
                                metadata: {
                                    ...(activeSub.metadata as any || {}),
                                    stackedOrders: [
                                        ...((activeSub.metadata as any)?.stackedOrders || []),
                                        paymentOrder.orderId
                                    ]
                                }
                            }
                        })

                        // Credit tokens for renewal
                        if (plan.tokensIncluded > 0) {
                            let balance = await tx.tokenBalance.findUnique({
                                where: { userId: paymentOrder.userId },
                            })

                            if (!balance) {
                                balance = await tx.tokenBalance.create({
                                    data: {
                                        userId: paymentOrder.userId,
                                        balance: 0,
                                        totalEarned: 0,
                                        totalSpent: 0,
                                    },
                                })
                            }

                            const newBalance = balance.balance + plan.tokensIncluded

                            await tx.tokenBalance.update({
                                where: { userId: paymentOrder.userId },
                                data: {
                                    balance: newBalance,
                                    totalEarned: { increment: plan.tokensIncluded },
                                },
                            })

                            await tx.tokenTransaction.create({
                                data: {
                                    userId: paymentOrder.userId,
                                    type: TransactionType.SUBSCRIPTION,
                                    status: 1, // COMPLETED
                                    amount: plan.tokensIncluded,
                                    balanceAfter: newBalance,
                                    description: `Tokens from ${plan.name} renewal`,
                                    reference: paymentOrder.orderId,
                                },
                            })
                        }

                        console.log(`Extended subscription ${activeSub.id} to ${endDate}`)

                        // Don't create new subscription, just return
                        return { updated: true }
                    } else {
                        // UPGRADE/DOWNGRADE: Different plan - cancel old, create new
                        console.log(`Upgrading subscription for user ${paymentOrder.userId} from plan ${activeSub.planId} to ${plan.id}`)

                        // Cancel old subscription (non-refundable)
                        await tx.subscription.update({
                            where: { id: activeSub.id },
                            data: {
                                status: 1, // CANCELLED
                                cancelledAt: now,
                                autoRenew: false,
                                metadata: {
                                    ...(activeSub.metadata as any || {}),
                                    cancelReason: 'UPGRADED',
                                    upgradedTo: plan.id
                                }
                            }
                        })

                        // New subscription starts immediately
                        startDate = now
                        endDate = calculateEndDate(startDate, plan.interval)
                    }
                } else {
                    // No active subscription - create new one
                    startDate = now
                    endDate = calculateEndDate(startDate, plan.interval)
                }

                // Create new subscription
                console.log(`Creating new subscription for user ${paymentOrder.userId}, plan ${plan.id}`)
                await tx.subscription.create({
                    data: {
                        userId: paymentOrder.userId,
                        planId: plan.id,
                        status: 0, // ACTIVE
                        startDate,
                        endDate,
                        autoRenew: true,
                        metadata: {
                            orderId: paymentOrder.orderId,
                            createdVia: 'PAYMENT'
                        }
                    }
                })

                // If plan has included tokens, add them?
                if (plan.tokensIncluded > 0) {
                    let balance = await tx.tokenBalance.findUnique({
                        where: { userId: paymentOrder.userId },
                    })

                    if (!balance) {
                        balance = await tx.tokenBalance.create({
                            data: {
                                userId: paymentOrder.userId,
                                balance: 0,
                                totalEarned: 0,
                                totalSpent: 0,
                            },
                        })
                    }

                    const newBalance = balance.balance + plan.tokensIncluded

                    await tx.tokenBalance.update({
                        where: { userId: paymentOrder.userId },
                        data: {
                            balance: newBalance,
                            totalEarned: { increment: plan.tokensIncluded },
                        },
                    })

                    await tx.tokenTransaction.create({
                        data: {
                            userId: paymentOrder.userId,
                            type: TransactionType.SUBSCRIPTION,
                            status: 1, // COMPLETED
                            amount: plan.tokensIncluded,
                            balanceAfter: newBalance,
                            description: `Tokens from ${plan.name} subscription`,
                            reference: paymentOrder.orderId,
                        },
                    })
                }
            }

            return { updated: true }
        })

        // Send Invoice Email
        if (txResult?.updated && paymentOrder.user?.email) {
            const invoiceData = {
                orderId: paymentOrder.orderId,
                amount: paymentOrder.amount,
                currency: 'INR',
                description: paymentOrder.type === PaymentType.TOKEN_BUNDLE
                    ? `Token Bundle Purchase`
                    : `Subscription Purchase`,
                customerName: paymentOrder.user.name || 'Customer'
            }
            // Fire and forget
            emailService.sendInvoice(paymentOrder.user.email, invoiceData).catch(err => {
                console.error('Failed to send invoice email:', err)
            })
        }

        return { status: 'SUCCESS', orderId }
    }

    return { status: 'PENDING', orderId }
}

const getTokenBundles = async () => {
    return db.tokenBundle.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: { price: 'asc' },
    })
}

const getPlans = async () => {
    return db.plan.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: { price: 'asc' },
    })
}

const handleWebhook = async (payload: any, signature: string, timestamp: string, rawBody: string) => {
    console.log('=== Processing Webhook ===')
    console.log('Payload:', JSON.stringify(payload, null, 2))
    console.log('Signature:', signature)
    console.log('Timestamp:', timestamp)
    console.log('Raw Body:', rawBody)

    let orderId: string | undefined

    // Detect webhook source and extract order ID
    if (payload?.response) {
        // PhonePe webhook format - base64 encoded response
        console.log('Detected PhonePe webhook')

        // Verify signature
        const isValid = phonePeService.verifyWebhookSignature(payload.response, signature)
        if (!isValid) {
            console.error('❌ PhonePe webhook signature verification failed')
            throw new BadRequestError('Invalid webhook signature')
        }

        // Decode response
        const decodedData = phonePeService.decodeWebhookResponse(payload.response)
        orderId = decodedData?.data?.merchantTransactionId
        console.log('Extracted Order ID from PhonePe:', orderId)
    } else {
        // Cashfree webhook format
        console.log('Detected Cashfree webhook')
        orderId = payload?.data?.order?.order_id || payload?.orderId || payload?.data?.order_id
        console.log('Extracted Order ID from Cashfree:', orderId)
    }

    if (!orderId) {
        console.error('❌ Webhook received without orderId', payload)
        throw new BadRequestError('Invalid webhook payload')
    }

    console.log(`✅ Processing webhook for order: ${orderId}`)
    const result = await verifyPayment(orderId)
    console.log('Verification Result:', result)
    return result
}

export default {
    createOrder,
    verifyPayment,
    getTokenBundles,
    getPlans,
    handleWebhook,
}
