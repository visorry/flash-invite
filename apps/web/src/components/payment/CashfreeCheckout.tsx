'use client'

import { useState } from 'react'
import { load } from '@cashfreepayments/cashfree-js'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface CashfreeCheckoutProps {
    orderId: string
    paymentSessionId: string
    onSuccess?: () => void
    onFailure?: (error: any) => void
    children?: React.ReactNode
    className?: string
}

export default function CashfreeCheckout({
    orderId,
    paymentSessionId,
    onSuccess,
    onFailure,
    children,
    className,
}: CashfreeCheckoutProps) {
    const [loading, setLoading] = useState(false)

    const handlePayment = async () => {
        setLoading(true)
        try {
            const cashfree = await load({
                mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox',
            })

            const checkoutOptions = {
                paymentSessionId,
                redirectTarget: '_self',
            }

            cashfree.checkout(checkoutOptions)
        } catch (error) {
            console.error('Cashfree checkout error:', error)
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
