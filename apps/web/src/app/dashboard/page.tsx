"use client"

import { useSession } from '@/hooks/use-session'
import { Bot, Link, Users, Coins, BookOpen } from 'lucide-react'
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
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/dashboard/groups' as any)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total<br />Groups
            </CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statsLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                ((stats as any)?.totalBots || 0).toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/dashboard/invites' as any)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active<br />Invites
            </CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {statsLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                ((stats as any)?.activeInvites || 0).toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/dashboard/members' as any)}
        >
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

        <Card
          className="bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 text-white hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1 transition-all cursor-pointer active:scale-[0.98] active:translate-y-0 transform-gpu shadow-md"
          onClick={() => router.push('/dashboard/tokens' as any)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Token<br />Balance
            </CardTitle>
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Coins className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((balance as any)?.balance || 0).toLocaleString()}
            </div>
            <p className="text-xs text-white/80 mt-1">Click to buy more</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Telegram Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {/* Tutorial */}
          <button
            onClick={() => router.push('/dashboard/tutorial' as any)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 border border-primary/20">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs font-medium text-center text-primary group-hover:text-primary/80 transition-colors">Tutorial &amp; Guide</span>
          </button>

          {/* Create Invite */}
          <button
            onClick={() => router.push('/dashboard/invites/create' as any)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 border border-border">
              <Link className="h-6 w-6 text-foreground" />
            </div>
            <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors">Create<br />Invite</span>
          </button>

          {/* Auto Approval */}
          <button
            onClick={() => router.push('/dashboard/auto-approval' as any)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 border border-border">
              <svg className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors">Auto Approval</span>
          </button>

          {/* Forward Rules */}
          <button
            onClick={() => router.push('/dashboard/forward-rules' as any)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 border border-border">
              <svg className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors">Forward Rules</span>
          </button>
        </div>
      </div>
    </div>
  )
}
