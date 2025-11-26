'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { useSearchParams, useRouter } from 'next/navigation'

interface Plan {
    id: string
    name: string
    description: string
    price: number
    interval: number
    features: any
    tokensIncluded: number
}

export default function SubscriptionPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const orderId = searchParams.get('order_id')

    const { data: plans, isLoading } = useQuery({
        queryKey: ['plans'],
        queryFn: async () => {
            return api.payments.getPlans()
        }
    })

    // Verify payment when redirected back with order_id
    useEffect(() => {
        if (orderId) {
            const verifyPayment = async () => {
                try {
                    const result = await api.payments.verify(orderId)

                    if (result.status === 'SUCCESS' || result.status === 'ALREADY_PAID') {
                        toast.success('Payment successful! Your subscription is now active.')
                        // Remove order_id from URL
                        router.replace('/subscription' as any)
                    } else if (result.status === 'FAILED') {
                        toast.error('Payment failed. Please try again.')
                        router.replace('/subscription' as any)
                    } else {
                        toast.info('Payment is being processed...')
                        // Keep checking or remove after some time
                        setTimeout(() => router.replace('/subscription' as any), 3000)
                    }
                } catch (error: any) {
                    toast.error(error.message || 'Failed to verify payment')
                    router.replace('/subscription' as any)
                }
            }

            verifyPayment()
        }
    }, [orderId, router])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    const planList = (plans as any) || []

    return (
        <div className="flex-1 space-y-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold">Upgrade Plan</h1>
                    <p className="text-xs text-muted-foreground">
                        Choose the plan that fits your needs
                    </p>
                </div>
            </div>

            {planList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {planList.map((plan: Plan) => (
                        <Card key={plan.id} className="flex flex-col relative overflow-hidden">
                            {/* Highlight popular plan if needed, logic can be added here */}
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-yellow-500" />
                                    {plan.name}
                                </CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="text-3xl font-bold mb-4">
                                    ₹{plan.price}
                                    <span className="text-sm font-normal text-muted-foreground">
                                        /{plan.interval === 0 ? 'month' : plan.interval === 1 ? 'year' : 'lifetime'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {/* Parse features if they are stored as JSON or array */}
                                    {(Array.isArray(plan.features) ? plan.features : []).map((feature: string, i: number) => (
                                        <div key={i} className="flex items-center text-sm">
                                            <Check className="mr-2 h-4 w-4 text-green-500 shrink-0" />
                                            {feature}
                                        </div>
                                    ))}
                                    {plan.tokensIncluded > 0 && (
                                        <div className="flex items-center text-sm font-medium">
                                            <Check className="mr-2 h-4 w-4 text-green-500 shrink-0" />
                                            {plan.tokensIncluded} Tokens Included
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter>
                                {plan.price > 0 ? (
                                    <PaymentButton
                                        referenceId={plan.id}
                                        type={0}
                                        amount={plan.price}
                                        label="Subscribe Now"
                                    />
                                ) : (
                                    <Button variant="secondary" disabled className="w-full opacity-100 font-semibold">
                                        Free Plan
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Zap className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <p className="text-sm text-muted-foreground">No plans available at the moment.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function PaymentButton({ referenceId, type, amount, label }: { referenceId: string, type: number, amount: number, label: string }) {
    const [loading, setLoading] = useState(false)

    const handlePayment = async () => {
        setLoading(true)

        const promise = async () => {
            const { paymentSessionId } = await api.payments.createOrder({
                referenceId,
                type
            })

            const { load } = await import('@cashfreepayments/cashfree-js')
            const cashfree = await load({
                mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox',
            })

            await cashfree.checkout({
                paymentSessionId,
                redirectTarget: '_self',
            })
        }

        toast.promise(promise(), {
            loading: 'Initializing payment...',
            success: 'Redirecting to payment gateway...',
            error: (err) => {
                setLoading(false)
                return err.message || 'Failed to initialize payment'
            }
        })
    }

    return (
        <Button onClick={handlePayment} disabled={loading} className="w-full">
            {loading ? 'Processing...' : label}
        </Button>
    )
}
