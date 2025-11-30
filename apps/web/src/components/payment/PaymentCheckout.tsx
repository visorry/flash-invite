'use client'

import { useState } from 'react'
import { load } from '@cashfreepayments/cashfree-js'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface PaymentCheckoutProps {
    orderId: string
    paymentSessionId?: string
    redirectUrl?: string
    gateway: number // 0 = Cashfree, 1 = PhonePe
    onSuccess?: () => void
    onFailure?: (error: any) => void
    children?: React.ReactNode
    className?: string
}

export default function PaymentCheckout({
    orderId,
    paymentSessionId,
    redirectUrl,
    gateway,
    onSuccess,
    onFailure,
    children,
    className,
}: PaymentCheckoutProps) {
    const [loading, setLoading] = useState(false)

    const handlePayment = async () => {
        setLoading(true)
        try {
            if (gateway === 1) {
                // PhonePe - Direct redirect
                if (!redirectUrl) {
                    throw new Error('PhonePe redirect URL not provided')
                }
                window.location.href = redirectUrl
            } else {
                // Cashfree - SDK checkout
                if (!paymentSessionId) {
                    throw new Error('Cashfree payment session ID not provided')
                }

                const cashfree = await load({
                    mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox',
                })

                const checkoutOptions = {
                    paymentSessionId,
                    redirectTarget: '_self',
                }

                cashfree.checkout(checkoutOptions)
            }
        } catch (error) {
            console.error('Payment checkout error:', error)
            toast.error('Failed to initialize payment')
            onFailure?.(error)
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handlePayment}
            disabled={loading}
            className={className}
        >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {children || 'Pay Now'}
        </Button>
    )
}
