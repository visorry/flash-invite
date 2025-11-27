"use client"

import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { Plus, Link as LinkIcon, Clock, Users, Ban, Share2, Copy, ChevronLeft, ChevronRight, Bot } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

const PAGE_SIZE = 10

export default function InvitesPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  // Fetch invites with pagination (latest first)
  const { data: invitesData, isLoading: invitesLoading } = useQuery({
    queryKey: ['invites', page],
    queryFn: async () => {
      return api.invites.list({
        page,
        size: PAGE_SIZE,
        sort: 'createdAt',
        order: 'desc',
      })
    },
  })

  const invites = (invitesData as any)?.items || []
  const total = (invitesData as any)?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

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

  const shareInvite = (inviteLink: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Group Invite',
        text: 'Click this link to join the group',
        url: inviteLink,
      }).catch(() => {
        // Fallback to copy if share fails
        navigator.clipboard.writeText(inviteLink)
        toast.success('Copied to clipboard')
      })
    } else {
      // Fallback to copy if Web Share API not supported
      navigator.clipboard.writeText(inviteLink)
      toast.success('Copied to clipboard')
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
        <Button onClick={() => router.push('/dashboard/invites/create' as any)}>
          <Plus className="w-4 h-4 mr-2" />
          Create
        </Button>
      </div>

      {/* Invites List */}
      {invitesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : invites.length > 0 ? (
        <div className="space-y-3">
          {invites.map((invite: any) => (
            <Card key={invite.id}>
              <CardContent className="pt-4 pb-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <LinkIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {invite.metadata?.name || 'Invite Link'}
                      </span>
                      {getStatusBadge(invite.status)}
                    </div>
                    {invite.telegramEntity && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        {invite.telegramEntity.title}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {new Date(invite.createdAt).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                  {invite.status === 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => revokeMutation.mutate(invite.id)}
                      disabled={revokeMutation.isPending}
                      className="flex-shrink-0 h-8 w-8 p-0"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {/* Invite Link - Mobile Optimized */}
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-2 py-1 rounded truncate min-w-0">
                    {invite.inviteLink}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(invite.inviteLink)
                      toast.success('Copied to clipboard')
                    }}
                    className="flex-shrink-0"
                  >
                    <span className="hidden sm:inline">Copy</span>
                    <Copy className="h-4 w-4 sm:hidden" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareInvite(invite.inviteLink)}
                    className="flex-shrink-0"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>Usage:</span>
                    </div>
                    <span className="font-medium">
                      {invite.memberLimit === 1 
                        ? `${invite.currentUses || 0} / 1 (One-time)`
                        : `${invite.currentUses || 0} / ${invite.memberLimit || '∞'}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Member Duration:</span>
                    </div>
                    <span className="font-medium">
                      {(() => {
                        const seconds = invite.durationSeconds || 0
                        const days = Math.floor(seconds / 86400)
                        const hours = Math.floor((seconds % 86400) / 3600)
                        if (days > 0) return `${days}d ${hours}h`
                        if (hours > 0) return `${hours}h`
                        return `${Math.floor(seconds / 60)}m`
                      })()}
                    </span>
                  </div>
                </div>

                {/* Cost */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Cost: {invite.tokensCost} tokens
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LinkIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">No invite links yet</p>
            <Button onClick={() => router.push('/dashboard/invites/create' as any)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Invite
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
