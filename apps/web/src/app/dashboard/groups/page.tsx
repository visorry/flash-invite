"use client"

import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { Plus, Bot, Users, RefreshCw } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function GroupsPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['telegram-entities'],
    queryFn: async () => {
      return api.telegramEntities.list()
    },
  })

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: (id: string) => api.telegramEntities.syncMembers(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-entities'] })
      toast.success('Member count synced successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sync member count')
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold">Telegram Groups</h1>
          <p className="text-xs text-muted-foreground sm:block">
            Manage your Telegram groups and channels
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/groups/add' as any)} size="sm" className="shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="sm:inline">Add Group</span>
        </Button>
      </div>

      {/* Groups List */}
      {groupsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (groups as any)?.items?.length > 0 ? (
        <div className="space-y-3">
          {(groups as any).items.map((group: any) => (
            <Card key={group.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      {group.title}
                      {group.isActive ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </CardTitle>
                    {group.username && (
                      <p className="text-xs text-muted-foreground mt-1">
                        @{group.username}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => syncMutation.mutate(group.id)}
                    disabled={syncMutation.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Description */}
                {group.description && (
                  <p className="text-xs text-muted-foreground">
                    {group.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{group.memberCount?.toLocaleString() || 0} members</span>
                  </div>
                  <div className="text-muted-foreground">
                    Type: {group.type === 0 ? 'Group' : group.type === 1 ? 'Supergroup' : 'Channel'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => router.push(`/dashboard/invites/create?groupId=${group.id}` as any)}
                  >
                    Create Invite
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => router.push(`/dashboard/groups/${group.id}` as any)}
                  >
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">No groups added yet</p>
            <Button onClick={() => router.push('/dashboard/groups/add' as any)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Group
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
