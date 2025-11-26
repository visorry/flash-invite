"use client"

import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { Coins, Clock, TrendingUp, TrendingDown, Info, X } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Duration unit labels
const DURATION_UNITS = [
  { value: 0, label: 'Minute' },
  { value: 1, label: 'Hour' },
  { value: 2, label: 'Day' },
  { value: 3, label: 'Month' },
  { value: 4, label: 'Year' },
]

export default function TokensPage() {
  const { user, isLoading } = useSession()
  const [showPricing, setShowPricing] = useState(false)

  // Fetch balance
  const { data: balance } = useQuery({
    queryKey: ['tokens', 'balance'],
    queryFn: async () => {
      return api.tokens.getBalance()
    },
  })

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['tokens', 'transactions'],
    queryFn: async () => {
      return api.tokens.getTransactions()
    },
  })

  // Fetch token pricing
  const { data: pricing } = useQuery({
    queryKey: ['tokens', 'costs'],
    queryFn: async () => {
      return api.tokens.getCosts()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex-1 space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Token Balance</h1>
          <p className="text-xs text-muted-foreground">
            Manage your tokens and view transaction history
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowPricing(true)}
          className="h-9 w-9"
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>

      {/* Pricing Modal */}
      {showPricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowPricing(false)}>
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-500" />
                  Token Pricing
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowPricing(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(pricing as any)?.length > 0 ? (
                <div className="space-y-2">
                  {(pricing as any).map((config: any) => {
                    const unitLabel = DURATION_UNITS.find(u => u.value === config.durationUnit)?.label || 'Unknown'
                    return (
                      <div
                        key={config.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <span className="text-sm font-medium">Per {unitLabel}</span>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                          {config.costPerUnit} tokens
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pricing configured. Invites are free!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 text-white">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-4">
            {((balance as any)?.balance || 0).toLocaleString()}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/70">Total Earned</p>
              <p className="font-semibold">{((balance as any)?.totalEarned || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/70">Total Spent</p>
              <p className="font-semibold">{((balance as any)?.totalSpent || 0).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Tokens */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Purchase Tokens</h2>
        <TokenBundles />
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (transactions as any)?.items?.length > 0 ? (
            <div className="space-y-2">
              {(transactions as any).items.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {tx.amount > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{tx.description || 'Transaction'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Balance: {tx.balanceAfter}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TokenBundles() {
  const { data: bundles, isLoading } = useQuery({
    queryKey: ['token-bundles'],
    queryFn: async () => {
      return api.payments.getBundles()
    }
  })

  if (isLoading) {
    return <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>
  }

  if (!bundles || (bundles as any).length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No token bundles available at the moment.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {(bundles as any).map((bundle: any) => (
        <Card key={bundle.id} className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{bundle.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{bundle.description}</p>
          </CardHeader>
          <CardContent className="flex-1 pb-2">
            <div className="flex items-center justify-center py-4">
              <Coins className="h-8 w-8 text-yellow-500 mr-2" />
              <div className="text-2xl font-bold">{bundle.tokens}</div>
            </div>
            <div className="text-center text-xl font-bold">
              ₹{bundle.price}
            </div>
          </CardContent>
          <div className="p-4 pt-0 mt-auto">
            <PaymentButton
              referenceId={bundle.id}
              type={1} // TOKEN_BUNDLE
              amount={bundle.price}
              label="Buy Now"
            />
          </div>
        </Card>
      ))}
    </div>
  )
}

import { toast } from 'sonner'

function PaymentButton({ referenceId, type, amount, label }: { referenceId: string, type: number, amount: number, label: string }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
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

    } catch (error) {
      console.error(error)
      toast.error('Payment initialization failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} className="w-full">
      {loading ? 'Processing...' : label}
    </Button>
  )
}
