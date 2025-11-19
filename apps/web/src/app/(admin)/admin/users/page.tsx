"use client"

import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { Users, Calendar, Coins, DollarSign } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AddTokensDialog } from '@/components/admin/add-tokens-dialog'
import { AddSubscriptionDialog } from '@/components/admin/add-subscription-dialog'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  const { user, isLoading } = useSession()
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isTokensDialogOpen, setIsTokensDialogOpen] = useState(false)
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false)

  // Fetch users
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      return api.admin.listUsers()
    },
  })

  // Fetch plans for subscription dialog
  const { data: plans } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: async () => {
      return api.admin.listPlans()
    },
  })

  const handleAddTokens = async (userId: string, amount: number, description: string) => {
    try {
      await api.admin.addTokens(userId, amount, description)
      toast.success(`Added ${amount} tokens successfully`)
      refetchUsers()
    } catch (error) {
      toast.error('Failed to add tokens')
      throw error
    }
  }

  const handleAddSubscription = async (userId: string, planId: string) => {
    try {
      await api.admin.addSubscription(userId, planId)
      toast.success('Subscription added successfully')
      refetchUsers()
    } catch (error) {
      toast.error('Failed to add subscription')
      throw error
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
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Users Management</h1>
        <p className="text-muted-foreground">
          View and manage all platform users
        </p>
      </div>

      {/* Users List */}
      {usersLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (users as any)?.items?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(users as any).items.map((u: any) => (
            <Card key={u.id}>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {u.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium truncate max-w-[150px]">{u.email}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Admin</span>
                  <Badge variant={u.isAdmin ? "default" : "outline"}>
                    {u.isAdmin ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Email Verified</span>
                  <Badge variant={u.emailVerified ? "default" : "secondary"}>
                    {u.emailVerified ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t">
                  <div>
                    <p className="text-muted-foreground">Groups</p>
                    <p className="font-semibold">{u._count?.telegramEntities || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Invites</p>
                    <p className="font-semibold">{u._count?.inviteLinks || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Subs</p>
                    <p className="font-semibold">{u._count?.subscriptions || 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedUser(u)
                      setIsTokensDialogOpen(true)
                    }}
                  >
                    <Coins className="h-4 w-4 mr-1" />
                    Add Tokens
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedUser(u)
                      setIsSubscriptionDialogOpen(true)
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Add Sub
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {selectedUser && (
        <>
          <AddTokensDialog
            open={isTokensDialogOpen}
            onOpenChange={setIsTokensDialogOpen}
            user={selectedUser}
            onSubmit={handleAddTokens}
          />
          <AddSubscriptionDialog
            open={isSubscriptionDialogOpen}
            onOpenChange={setIsSubscriptionDialogOpen}
            user={selectedUser}
            plans={(plans as any) || []}
            onSubmit={handleAddSubscription}
          />
        </>
      )}
    </div>
  )
}
