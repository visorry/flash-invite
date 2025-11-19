"use client"

import { useSession } from '@/hooks/use-session'
import { Bot, Link, Users, Coins } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      return api.dashboard.getStats()
    },
    refetchInterval: 30000,
  })

  // Fetch token balance
  const { data: balance } = useQuery({
    queryKey: ['tokens', 'balance'],
    queryFn: async () => {
      return api.tokens.getBalance()
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
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">You need to be logged in.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-xs text-muted-foreground">
          Welcome back, {user.name}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-primary text-primary-foreground hover:shadow-xl hover:scale-[1.02] transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total<br />Groups
            </CardTitle>
            <div className="p-2 bg-primary-foreground/20 backdrop-blur-sm rounded-lg">
              <Bot className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 bg-primary-foreground/20 rounded animate-pulse" />
              ) : (
                ((stats as any)?.totalBots || 0).toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground hover:shadow-xl hover:scale-[1.02] transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active<br />Invites
            </CardTitle>
            <div className="p-2 bg-primary-foreground/20 backdrop-blur-sm rounded-lg">
              <Link className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 bg-primary-foreground/20 rounded animate-pulse" />
              ) : (
                ((stats as any)?.activeInvites || 0).toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total<br />Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {statsLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                ((stats as any)?.totalMembers || 0).toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Token<br />Balance
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {((balance as any)?.balance || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="w-full h-auto flex-col gap-2 py-4"
              onClick={() => router.push('/groups/add' as any)}
            >
              <Bot className="h-5 w-5" />
              <span className="text-sm">Add Group</span>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto flex-col gap-2 py-4"
              onClick={() => router.push('/invites/create' as any)}
            >
              <Link className="h-5 w-5" />
              <span className="text-sm">Create Invite</span>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto flex-col gap-2 py-4"
              onClick={() => router.push('/tokens' as any)}
            >
              <Coins className="h-5 w-5" />
              <span className="text-sm">Buy Tokens</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
