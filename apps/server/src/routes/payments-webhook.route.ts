import Router from '../lib/router'
import type { Request } from 'express'
import paymentService from '../services/payment.service'

const router = Router()

export const name = 'payments'

router.post(
    '/webhook',
    async (req: Request) => {
        console.log('=== Cashfree Webhook Received ===')
        console.log('Headers:', JSON.stringify(req.headers, null, 2))
        console.log('Body:', JSON.stringify(req.body, null, 2))

        // Extract signature and timestamp from headers
        const signature = (req.headers['x-webhook-signature'] as string) || ''
        const timestamp = (req.headers['x-webhook-timestamp'] as string) || ''
        console.log('Signature:', signature)
        console.log('Timestamp:', timestamp)

        // Get raw body that was captured by middleware
        const rawBody = (req as any).rawBody || JSON.stringify(req.body)
        console.log('Raw Body Length:', rawBody.length)

        return paymentService.handleWebhook(req.body, signature, timestamp, rawBody)
    }
)

export { router }
