"use client"

import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { Plus, Link as LinkIcon, Clock, Users, Ban } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function InvitesPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch invites
  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ['invites'],
    queryFn: async () => {
      return api.invites.list()
    },
  })

  // Revoke mutation
  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.invites.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
      toast.success('Invite link revoked successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to revoke invite')
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

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge className="bg-green-500">Active</Badge>
      case 1:
        return <Badge variant="secondary">Expired</Badge>
      case 2:
        return <Badge variant="destructive">Revoked</Badge>
      case 3:
        return <Badge variant="outline">Limit Reached</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Invite Links</h1>
          <p className="text-xs text-muted-foreground">
            Manage your time-limited invite links
          </p>
        </div>
        <Button onClick={() => router.push('/invites/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create
        </Button>
      </div>

      {/* Invites List */}
      {invitesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (invites as any)?.items?.length > 0 ? (
        <div className="space-y-3">
          {(invites as any).items.map((invite: any) => (
            <Card key={invite.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Invite Link
                      {getStatusBadge(invite.status)}
                    </CardTitle>
                  </div>
                  {invite.status === 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => revokeMutation.mutate(invite.id)}
                      disabled={revokeMutation.isPending}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Invite Link */}
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-2 py-1 rounded truncate">
                    {invite.inviteLink}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(invite.inviteLink)
                      toast.success('Copied to clipboard')
                    }}
                  >
                    Copy
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{invite.currentUses || 0} / {invite.memberLimit || '∞'} uses</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {invite.expiresAt
                        ? new Date(invite.expiresAt).toLocaleDateString()
                        : 'No expiry'}
                    </span>
                  </div>
                </div>

                {/* Cost */}
                <div className="text-xs text-muted-foreground">
                  Cost: {invite.tokensCost} tokens
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LinkIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">No invite links yet</p>
            <Button onClick={() => router.push('/invites/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Invite
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
