import { z } from 'zod'
import { PaymentType } from '@super-invite/db'

export const CreateOrderSchema = z.object({
    referenceId: z.string().uuid(),
    type: z.nativeEnum(PaymentType),
})

export const VerifyPaymentSchema = z.object({
    orderId: z.string(),
})
