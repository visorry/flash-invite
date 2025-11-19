"use client"

import { useSession } from '@/hooks/use-session'
import { Users, Mail, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminUsersPage() {
  const { user, isLoading } = useSession()

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      return api.admin.listUsers()
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
    <div className="flex-1 space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Users Management</h1>
        <p className="text-xs text-muted-foreground">
          View and manage all platform users
        </p>
      </div>

      {/* Users List */}
      {usersLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (users as any)?.items?.length > 0 ? (
        <div className="space-y-3">
          {(users as any).items.map((u: any) => (
            <Card key={u.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {u.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Groups</p>
                    <p className="font-semibold">{u._count?.telegramEntities || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Invites</p>
                    <p className="font-semibold">{u._count?.inviteLinks || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Subscriptions</p>
                    <p className="font-semibold">{u._count?.subscriptions || 0}</p>
                  </div>
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
    </div>
  )
}
