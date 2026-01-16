"use client"

import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PromoterStatsPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  // Fetch config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['promoter-config', id],
    queryFn: () => api.promoter.getById(id),
    enabled: !!id,
  })

  // Fetch stats
  const { data: stats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ['promoter-stats', id],
    queryFn: () => api.promoter.getStats(id),
    enabled: !!id,
  })

  if (isLoading || configLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !config) {
    return null
  }

  const c = config as any
  const s = stats as any
  const posts = s?.recentPosts || []

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
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{c.name}</h1>
          <p className="text-xs text-muted-foreground">
            Promoter statistics and posts
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={statsLoading}
        >
          <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Captures</div>
            <div className="text-2xl font-bold">{s?.totalCaptures || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Marketing Posts</div>
            <div className="text-2xl font-bold">{s?.totalMarketingPosts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Deliveries</div>
            <div className="text-2xl font-bold">{s?.totalDeliveries || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Unique Users</div>
            <div className="text-2xl font-bold">{s?.uniqueRecipients || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Deliveries per Post</span>
            <span className="font-medium">{s?.avgDeliveriesPerPost?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active Posts</span>
            <span className="font-medium">{posts.filter((p: any) => !p.isExpired).length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expired Posts</span>
            <span className="font-medium">{posts.filter((p: any) => p.isExpired).length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map((post: any) => (
                <div key={post.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={post.isExpired ? 'secondary' : 'default'} className="text-xs">
                        {post.mediaType === 0 ? 'Photo' : post.mediaType === 1 ? 'Video' : 'Document'}
                      </Badge>
                      {post.isExpired && (
                        <Badge variant="outline" className="text-xs">Expired</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {post._count?.deliveries || 0} deliveries
                    </div>
                  </div>
                  {post.caption && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {post.caption}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Token: {post.token.substring(0, 8)}...</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No posts captured yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bot</span>
            <span>@{c.bot?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vault Group</span>
            <span>{c.vaultGroup?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Marketing Group</span>
            <span>{c.marketingGroup?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Token Expiry</span>
            <span>{c.tokenExpiryDays} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={c.isActive ? 'default' : 'secondary'} className="text-xs">
              {c.isActive ? 'Active' : 'Paused'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
