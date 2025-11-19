"use client"

import { useSession } from '@/hooks/use-session'
import { Link as LinkIcon, Calendar, Users, Clock, ExternalLink } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATUS_LABELS = {
  0: { label: 'Active', variant: 'default' as const },
  1: { label: 'Expired', variant: 'secondary' as const },
  2: { label: 'Revoked', variant: 'destructive' as const },
}

export default function AdminInvitesPage() {
  const { user, isLoading } = useSession()

  // Fetch all invites
  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ['admin', 'invites'],
    queryFn: async () => {
      return api.admin.listAllInvites()
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

  const formatDuration = (seconds: number) => {
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Invite Links Management</h1>
        <p className="text-muted-foreground">
          View and manage all invite links across the platform
        </p>
      </div>

      {/* Invites List */}
      {invitesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (invites as any)?.items?.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(invites as any).items.map((invite: any) => (
            <Card key={invite.id}>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  {invite.telegramEntity?.title || 'Unknown Group'}
                </CardTitle>
                {invite.telegramEntity?.username && (
                  <a 
                    href={`https://t.me/${invite.telegramEntity.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    @{invite.telegramEntity.username}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={STATUS_LABELS[invite.status as keyof typeof STATUS_LABELS]?.variant}>
                    {STATUS_LABELS[invite.status as keyof typeof STATUS_LABELS]?.label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(invite.durationSeconds)}
                  </span>
                </div>

                {invite.memberLimit && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Member Limit</span>
                    <span className="font-medium flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {invite.currentUses} / {invite.memberLimit}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tokens Cost</span>
                  <span className="font-medium">{invite.tokensCost}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created By</span>
                  <span className="font-medium truncate max-w-[150px]">
                    {invite.user?.name || 'Unknown'}
                  </span>
                </div>

                {invite.expiresAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="font-medium">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Calendar className="h-3 w-3" />
                  <span>Created {new Date(invite.createdAt).toLocaleDateString()}</span>
                </div>

                {invite.inviteLink && (
                  <div className="pt-2 border-t">
                    <a 
                      href={invite.inviteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
                    >
                      View Link
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LinkIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">No invite links found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
