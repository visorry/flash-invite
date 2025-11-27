'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Zap } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { useSearchParams, useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSession } from "@/hooks/use-session"

interface Plan {
    id: string
    name: string
    description: string
    price: number
    interval: number
    features: any
    tokensIncluded: number
}

function SubscriptionPageContent() {
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

export default function SubscriptionPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        }>
            <SubscriptionPageContent />
        </Suspense>
    )
}

function PaymentButton({ referenceId, type, amount, label }: { referenceId: string, type: number, amount: number, label: string }) {
    const { user } = useSession()
    const [loading, setLoading] = useState(false)
    const [showPhoneDialog, setShowPhoneDialog] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState('')

    const handleInitialClick = async () => {
        setLoading(true)
        try {
            // Fetch fresh user profile to check phone number
            const profile = await api.user.getProfile()
            if (profile?.phoneNumber) {
                handlePayment()
            } else {
                setShowPhoneDialog(true)
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error)
            setShowPhoneDialog(true)
        } finally {
            setLoading(false)
        }
    }

    const handlePayment = async (phone?: string) => {
        setLoading(true)

        const promise = async () => {
            // If phone number is provided, update it in the database first
            if (phone) {
                await api.user.updatePhone(phone)
            }

            const { paymentSessionId } = await api.payments.createOrder({
                referenceId,
                type,
                phoneNumber: phone
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
                setShowPhoneDialog(false)
                return err.message || 'Failed to initialize payment'
            }
        })
    }

    return (
        <>
            <Button onClick={handleInitialClick} disabled={loading} className="w-full">
                {loading ? 'Processing...' : label}
            </Button>

            <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enter Phone Number</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                                placeholder="9876543210"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                type="tel"
                            />
                            <p className="text-xs text-muted-foreground">
                                Required for payment processing. We'll save this for future purchases.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPhoneDialog(false)}>Cancel</Button>
                        <Button onClick={() => handlePayment(phoneNumber)} disabled={!phoneNumber || phoneNumber.length < 10}>
                            Proceed to Pay
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
