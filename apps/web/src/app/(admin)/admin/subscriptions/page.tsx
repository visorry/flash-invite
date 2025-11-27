"use client"

import { useSession } from '@/hooks/use-session'
import { DollarSign, Calendar, Users } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useState } from 'react'
import PlansManagement from '@/components/admin/PlansManagement'
import TokenBundlesManagement from '@/components/admin/TokenBundlesManagement'

const STATUS_LABELS = {
  0: { label: 'Active', variant: 'default' as const },
  1: { label: 'Expired', variant: 'secondary' as const },
  2: { label: 'Cancelled', variant: 'destructive' as const },
}

export default function AdminSubscriptionsPage() {
  const { user, isLoading } = useSession()
  const queryClient = useQueryClient()
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false)

  // Fetch subscriptions
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: async () => {
      return api.admin.listSubscriptions()
    },
  })

  // Migration mutation
  const migrateMutation = useMutation({
    mutationFn: async () => {
      return api.admin.migration.assignFreeTier()
    },
    onSuccess: (result: any) => {
      toast.success(`Migration complete! Assigned: ${result.assigned}, Skipped: ${result.skipped}`)
      if (result.errors?.length > 0) {
        toast.error(`${result.errors.length} errors occurred. Check console for details.`)
        console.error('Migration errors:', result.errors)
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] })
      setMigrationDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Migration failed')
    },
  })

  const handleMigration = async () => {
    setIsMigrating(true)
    try {
      await migrateMutation.mutateAsync()
    } finally {
      setIsMigrating(false)
    }
  }

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
    <div className="flex-1 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Subscriptions & Plans</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage subscription plans and user subscriptions
          </p>
        </div>
        <Button
          onClick={() => setMigrationDialogOpen(true)}
          disabled={isMigrating}
          variant="outline"
          className="gap-2 w-full md:w-auto"
          size="sm"
        >
          <Users className="h-4 w-4" />
          <span className="truncate">{isMigrating ? 'Migrating...' : 'Assign Free Tier'}</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="subscriptions" className="text-xs md:text-sm">
            User Subscriptions
          </TabsTrigger>
          <TabsTrigger value="plans" className="text-xs md:text-sm">
            Plans Management
          </TabsTrigger>
          <TabsTrigger value="bundles" className="text-xs md:text-sm">
            Token Bundles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4 mt-4">
          {subscriptionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (subscriptions as any)?.items?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {(subscriptions as any).items.map((sub: any) => (
                <Card key={sub.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm md:text-base font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                      <span className="truncate">{sub.plan?.name || 'Unknown Plan'}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5 md:space-y-3 pt-0">
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">User</span>
                      <span className="font-medium truncate max-w-[120px] md:max-w-[150px]">
                        {sub.user?.name || 'Unknown'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-bold text-base md:text-lg">₹{sub.plan?.price || 0}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge
                        variant={STATUS_LABELS[sub.status as keyof typeof STATUS_LABELS]?.variant}
                        className="text-xs"
                      >
                        {STATUS_LABELS[sub.status as keyof typeof STATUS_LABELS]?.label}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Auto Renew</span>
                      <Badge variant={sub.autoRenew ? "default" : "outline"} className="text-xs">
                        {sub.autoRenew ? 'Yes' : 'No'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Start Date</span>
                      <span className="font-medium text-xs md:text-sm">
                        {new Date(sub.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit'
                        })}
                      </span>
                    </div>

                    {sub.endDate && (
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">End Date</span>
                        <span className="font-medium text-xs md:text-sm">
                          {new Date(sub.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: '2-digit'
                          })}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        Created {new Date(sub.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground">No subscriptions found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          <PlansManagement />
        </TabsContent>

        <TabsContent value="bundles" className="mt-4">
          <TokenBundlesManagement />
        </TabsContent>
      </Tabs>

      {/* Migration Confirmation Dialog */}
      <AlertDialog open={migrationDialogOpen} onOpenChange={setMigrationDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg md:text-xl">
              Assign Free Tier to All Users
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will assign free tier subscriptions to all users who don't currently have any subscription.
              Users with existing subscriptions will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMigration} className="w-full sm:w-auto">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
