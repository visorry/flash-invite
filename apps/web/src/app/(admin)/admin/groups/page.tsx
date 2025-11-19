"use client"

import { useSession } from '@/hooks/use-session'
import { Bot, Users, Calendar, ExternalLink } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AdminGroupsPage() {
  const { user, isLoading } = useSession()

  // Fetch all groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['admin', 'groups'],
    queryFn: async () => {
      return api.admin.listAllGroups()
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
        <h1 className="text-3xl font-bold">Groups Management</h1>
        <p className="text-muted-foreground">
          View and manage all Telegram groups and channels
        </p>
      </div>

      {/* Groups List */}
      {groupsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (groups as any)?.items?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(groups as any).items.map((group: any) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  {group.title}
                </CardTitle>
                {group.username && (
                  <a 
                    href={`https://t.me/${group.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    @{group.username}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="outline">
                    {group.type === 0 ? 'Group' : 'Channel'}
                  </Badge>
                </div>

                {group.memberCount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Members</span>
                    <span className="font-medium flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {group.memberCount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={group.isActive ? "default" : "secondary"}>
                    {group.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bot Added</span>
                  <Badge variant={group.botAdded ? "default" : "outline"}>
                    {group.botAdded ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-medium truncate max-w-[150px]">
                    {group.user?.name || 'Unknown'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Invites</span>
                  <span className="font-medium">
                    {group._count?.inviteLinks || 0}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Calendar className="h-3 w-3" />
                  <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">No groups found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
