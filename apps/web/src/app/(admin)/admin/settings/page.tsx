"use client"

import { useSession } from '@/hooks/use-session'
import { Settings, Coins, DollarSign, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function AdminSettingsPage() {
  const { user, isLoading } = useSession()

  // Fetch plans
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: async () => {
      return api.admin.listPlans()
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
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Platform configuration and settings
        </p>
      </div>

      {/* Plans Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Subscription Plans
        </h2>

        {plansLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (plans as any)?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(plans as any).map((plan: any) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-bold text-lg">${plan.price}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tokens Included</span>
                    <span className="font-medium flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      {plan.tokensIncluded.toLocaleString()}
                    </span>
                  </div>

                  {plan.maxGroups && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Max Groups</span>
                      <span className="font-medium">{plan.maxGroups}</span>
                    </div>
                  )}

                  {plan.maxInvitesPerDay && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Max Invites/Day</span>
                      <span className="font-medium">{plan.maxInvitesPerDay}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Subscriptions</span>
                    <span className="font-medium">{plan._count?.subscriptions || 0}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium ${plan.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground">No plans configured</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Platform Settings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Platform Settings
        </h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Token Configuration</CardTitle>
            <CardDescription>Configure token costs and rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Token configuration settings will be available here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Telegram Bot Settings</CardTitle>
            <CardDescription>Configure Telegram bot integration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bot configuration settings will be available here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
