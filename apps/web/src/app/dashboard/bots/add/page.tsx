"use client"

import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Bot, Coins } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AddBotPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [token, setToken] = useState('')

  // Fetch bot cost config
  const { data: costConfig } = useQuery({
    queryKey: ['bot-cost'],
    queryFn: async () => {
      return api.bots.getCost()
    },
  })

  // Fetch existing bots count
  const { data: bots } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      return api.bots.list()
    },
  })

  // Fetch user's token balance
  const { data: balance } = useQuery({
    queryKey: ['token-balance'],
    queryFn: async () => {
      return api.tokens.getBalance()
    },
  })

  // Create bot mutation
  const createMutation = useMutation({
    mutationFn: (token: string) => api.bots.create(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      queryClient.invalidateQueries({ queryKey: ['token-balance'] })
      toast.success('Bot added successfully!')
      router.push('/dashboard/bots' as any)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add bot')
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

  const config = costConfig as any
  const botsList = (bots as any) || []
  const userBalance = (balance as any)?.balance || 0
  const freeBotsAllowed = config?.freeBotsAllowed || 1
  const costPerBot = config?.costPerBot || 0
  const needsPayment = botsList.length >= freeBotsAllowed && costPerBot > 0
  const canAfford = userBalance >= costPerBot

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      toast.error('Please enter a bot token')
      return
    }
    createMutation.mutate(token.trim())
  }

  return (
    <div className="flex-1 space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold">Add Bot</h1>
          <p className="text-xs text-muted-foreground">
            Connect your Telegram bot
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4" />
            How to get your bot token
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <ol className="list-decimal list-inside space-y-2">
            <li>Open Telegram and search for @BotFather</li>
            <li>Send /newbot to create a new bot</li>
            <li>Follow the prompts to set a name and username</li>
            <li>Copy the bot token provided by BotFather</li>
            <li>Paste the token below</li>
          </ol>
        </CardContent>
      </Card>

      {/* Cost Info */}
      {needsPayment && (
        <Card className={!canAfford ? 'border-destructive' : ''}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Token Cost
            </CardTitle>
            <CardDescription>
              You've used your {freeBotsAllowed} free bot{freeBotsAllowed > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Cost per additional bot:</span>
              <span className="font-medium">{costPerBot} tokens</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Your balance:</span>
              <span className={`font-medium ${!canAfford ? 'text-destructive' : ''}`}>
                {userBalance} tokens
              </span>
            </div>
            {!canAfford && (
              <p className="text-xs text-destructive mt-2">
                You need {costPerBot - userBalance} more tokens to add a bot.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Token Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Bot Token</CardTitle>
          <CardDescription>
            Paste your bot token from BotFather
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="font-mono text-xs"
            />
            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending || (needsPayment && !canAfford)}
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Validating...
                </>
              ) : needsPayment ? (
                `Add Bot (${costPerBot} tokens)`
              ) : (
                'Add Bot (Free)'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Note */}
      <p className="text-xs text-muted-foreground text-center">
        Your bot token is stored securely and never shared.
      </p>
    </div>
  )
}
