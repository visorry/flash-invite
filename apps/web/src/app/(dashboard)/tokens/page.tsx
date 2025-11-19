"use client"

import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { Coins, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TokensPage() {
  const { user, isLoading } = useSession()

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

  // Fetch costs
  const { data: costs } = useQuery({
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
      <div>
        <h1 className="text-lg font-semibold">Token Balance</h1>
        <p className="text-xs text-muted-foreground">
          Manage your tokens and view transaction history
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white">
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

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Token Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(costs as any)?.map((cost: any) => (
              <div
                key={cost.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="text-sm font-medium">{cost.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Duration: {cost.action === 0 ? '1 Hour' : cost.action === 1 ? '3 Hours' : cost.action === 2 ? '6 Hours' : cost.action === 3 ? '12 Hours' : cost.action === 4 ? '24 Hours' : cost.action === 5 ? '3 Days' : cost.action === 6 ? '7 Days' : '30 Days'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{cost.cost} tokens</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
