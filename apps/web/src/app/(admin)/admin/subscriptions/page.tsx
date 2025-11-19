"use client"

import { useSession } from '@/hooks/use-session'
import { DollarSign, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATUS_LABELS = {
  0: { label: 'Active', variant: 'default' as const },
  1: { label: 'Expired', variant: 'secondary' as const },
  2: { label: 'Cancelled', variant: 'destructive' as const },
}

export default function AdminSubscriptionsPage() {
  const { user, isLoading } = useSession()

  // Fetch subscriptions
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: async () => {
      return api.admin.listSubscriptions()
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
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Subscriptions Management</h1>
        <p className="text-muted-foreground">
          View and manage all platform subscriptions
        </p>
      </div>

      {/* Subscriptions List */}
      {subscriptionsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (subscriptions as any)?.items?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(subscriptions as any).items.map((sub: any) => (
            <Card key={sub.id}>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {sub.plan?.name || 'Unknown Plan'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-medium truncate max-w-[150px]">
                    {sub.user?.name || 'Unknown'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-bold text-lg">${sub.plan?.price || 0}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={STATUS_LABELS[sub.status as keyof typeof STATUS_LABELS]?.variant}>
                    {STATUS_LABELS[sub.status as keyof typeof STATUS_LABELS]?.label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Auto Renew</span>
                  <Badge variant={sub.autoRenew ? "default" : "outline"}>
                    {sub.autoRenew ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">
                    {new Date(sub.startDate).toLocaleDateString()}
                  </span>
                </div>

                {sub.endDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">End Date</span>
                    <span className="font-medium">
                      {new Date(sub.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Calendar className="h-3 w-3" />
                  <span>Created {new Date(sub.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">No subscriptions found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
