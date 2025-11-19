"use client"

import { useSession } from '@/hooks/use-session'
import { Users, Bot, Link, DollarSign, TrendingUp, Activity } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function AdminDashboardPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      return api.admin.getStats()
    },
    refetchInterval: 30000,
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
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total<br />Users
            </CardTitle>
            <Users className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 bg-white/20 rounded animate-pulse" />
              ) : (
                ((stats as any)?.totalUsers || 0).toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total<br />Groups
            </CardTitle>
            <Bot className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 bg-white/20 rounded animate-pulse" />
              ) : (
                ((stats as any)?.totalTelegramEntities || 0).toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total<br />Invites
            </CardTitle>
            <Link className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 bg-white/20 rounded animate-pulse" />
              ) : (
                ((stats as any)?.totalInviteLinks || 0).toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active<br />Invites
            </CardTitle>
            <Activity className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 bg-white/20 rounded animate-pulse" />
              ) : (
                ((stats as any)?.activeInviteLinks || 0).toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-pink-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total<br />Subscriptions
            </CardTitle>
            <DollarSign className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 bg-white/20 rounded animate-pulse" />
              ) : (
                ((stats as any)?.totalSubscriptions || 0).toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active<br />Subscriptions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 bg-white/20 rounded animate-pulse" />
              ) : (
                ((stats as any)?.activeSubscriptions || 0).toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push('/admin/users')}
        >
          <CardContent className="flex flex-col items-center justify-center py-6">
            <Users className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm font-medium">Manage Users</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push('/admin/subscriptions')}
        >
          <CardContent className="flex flex-col items-center justify-center py-6">
            <DollarSign className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm font-medium">Subscriptions</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push('/admin/groups')}
        >
          <CardContent className="flex flex-col items-center justify-center py-6">
            <Bot className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm font-medium">All Groups</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push('/admin/invites')}
        >
          <CardContent className="flex flex-col items-center justify-center py-6">
            <Link className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm font-medium">All Invites</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
