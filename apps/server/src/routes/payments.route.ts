import Router from '../lib/router'
import type { Request } from 'express'
import paymentService from '../services/payment.service'
import { getRequestContext } from '../helper/context'
import { CreateOrderSchema, VerifyPaymentSchema } from '../validation/payment.validation'

const router = Router()

export const name = 'payments'

router.post(
    '/create-order',
    async (req: Request) => {
        const ctx = getRequestContext(req)
        const { referenceId, type, phoneNumber } = req.validatedBody
        return paymentService.createOrder(ctx, referenceId, type, phoneNumber)
    },
    {
        validation: CreateOrderSchema,
    }
)

router.post(
    '/verify',
    async (req: Request) => {
        const { orderId } = req.validatedBody
        return paymentService.verifyPayment(orderId)
    },
    {
        validation: VerifyPaymentSchema,
    }
)

router.get(
    '/bundles',
    async (_req: Request) => {
        return paymentService.getTokenBundles()
    }
)

router.get(
    '/plans',
    async (_req: Request) => {
        return paymentService.getPlans()
    }
)

export { router }
