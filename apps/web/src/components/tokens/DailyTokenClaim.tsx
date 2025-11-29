"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Gift, Clock, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export function DailyTokenClaim() {
  const queryClient = useQueryClient()
  const [claiming, setClaiming] = useState(false)

  // Fetch claim status
  const { data: claimStatus, isLoading } = useQuery({
    queryKey: ['tokens', 'claim-status'],
    queryFn: async () => {
      return api.tokens.getClaimStatus()
    },
    refetchInterval: 60000, // Refetch every minute
  })

  // Claim mutation
  const claimMutation = useMutation({
    mutationFn: async () => {
      setClaiming(true)
      return api.tokens.claimDaily()
    },
    onSuccess: (data: any) => {
      toast.success(
        `🎉 Claimed ${data.tokensGranted} tokens successfully!`,
        {
          description: `New balance: ${data.newBalance} tokens`,
        }
      )
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tokens', 'claim-status'] })
      queryClient.invalidateQueries({ queryKey: ['tokens', 'balance'] })
      queryClient.invalidateQueries({ queryKey: ['tokens', 'transactions'] })
    },
    onError: (error: any) => {
      toast.error('Failed to claim tokens', {
        description: error.message || 'Please try again later',
      })
    },
    onSettled: () => {
      setClaiming(false)
    },
  })

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    )
  }

  const status = claimStatus as any

  // Don't show if user can't claim and has no subscription
  if (!status?.canClaim && status?.reason === 'No active subscription') {
    return null
  }

  // Don't show if plan doesn't have daily tokens
  if (!status?.canClaim && status?.reason === 'Plan does not include daily tokens') {
    return null
  }

  const canClaim = status?.canClaim
  const dailyTokens = status?.dailyTokens || 0
  const nextClaimDate = status?.nextClaimDate ? new Date(status.nextClaimDate) : null
  const now = new Date()

  // Calculate time until next claim
  const getTimeUntilClaim = () => {
    if (!nextClaimDate) return null
    const diff = nextClaimDate.getTime() - now.getTime()
    if (diff <= 0) return null

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const timeUntilClaim = getTimeUntilClaim()

  return (
    <Card className={canClaim ? "border-amber-500/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className={`h-5 w-5 ${canClaim ? 'text-amber-600' : 'text-muted-foreground'}`} />
          Daily Token Claim
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canClaim ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Available to claim</p>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span className="font-bold text-lg text-amber-600">{dailyTokens}</span>
                  <span className="text-sm text-muted-foreground">tokens</span>
                </div>
              </div>
              {status?.planName && (
                <p className="text-xs text-muted-foreground">
                  From your {status.planName} plan
                </p>
              )}
            </div>

            <Button
              onClick={() => claimMutation.mutate()}
              disabled={claiming}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              size="lg"
            >
              {claiming ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Claiming...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  <span>Claim {dailyTokens} Tokens</span>
                </div>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Already claimed today!</p>
                <p className="text-xs text-muted-foreground">
                  You claimed {dailyTokens} tokens today
                </p>
              </div>
            </div>

            {timeUntilClaim && (
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Next claim in</span>
                </div>
                <span className="font-bold text-sm">{timeUntilClaim}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
