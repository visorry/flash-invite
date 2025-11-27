"use client"

import { useSession } from '@/hooks/use-session'
import { useConfirm } from '@/hooks/use-confirm'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bot, Users, Link as LinkIcon, Plus, Star, Unlink } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function GroupDetailsPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()
  const groupId = params.id as string

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['telegram-entity', groupId],
    queryFn: async () => {
      return api.telegramEntities.getById(groupId)
    },
  })

  // Fetch user's bots
  const { data: bots } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      return api.bots.list()
    },
  })

  // Fetch invites for this group
  const { data: invites } = useQuery({
    queryKey: ['invites', { groupId }],
    queryFn: async () => {
      return api.invites.list({ telegramEntityId: groupId })
    },
  })

  // Fetch members for this group
  const { data: members } = useQuery({
    queryKey: ['members', { groupId }],
    queryFn: async () => {
      return api.members.list({ telegramEntityId: groupId })
    },
  })

  // Link bot mutation
  const linkBotMutation = useMutation({
    mutationFn: ({ botId, isPrimary }: { botId: string; isPrimary: boolean }) =>
      api.bots.linkToEntity(botId, groupId, isPrimary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-entity', groupId] })
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast.success('Bot linked to group')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to link bot')
    },
  })

  // Unlink bot mutation
  const unlinkBotMutation = useMutation({
    mutationFn: (botId: string) => api.bots.unlinkFromEntity(botId, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-entity', groupId] })
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast.success('Bot unlinked from group')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unlink bot')
    },
  })

  // Set primary bot mutation
  const setPrimaryMutation = useMutation({
    mutationFn: (botId: string) => api.bots.linkToEntity(botId, groupId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-entity', groupId] })
      toast.success('Primary bot updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set primary bot')
    },
  })

  if (isLoading || groupLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !group) {
    return null
  }

  const groupData = group as any
  const botsList = (bots as any) || []
  const invitesList = (invites as any)?.items || []
  const membersList = (members as any)?.items || []
  const linkedBots = groupData.botLinks || []

  // Get bots not yet linked to this group
  const unlinkedBots = botsList.filter(
    (bot: any) => !linkedBots.find((link: any) => link.botId === bot.id)
  )

  return (
    <div className="flex-1 space-y-6 p-4">
      <ConfirmDialog />
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {groupData.title}
          </h1>
          {groupData.username && (
            <p className="text-xs text-muted-foreground">
              @{groupData.username}
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => router.push(`/dashboard/invites/create?groupId=${groupId}` as any)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invite
        </Button>
      </div>

      {/* Group Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Group Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <p className="mt-1">
                {groupData.type === 0 ? 'Group' : groupData.type === 1 ? 'Supergroup' : 'Channel'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Members:</span>
              <p className="mt-1">{groupData.memberCount?.toLocaleString() || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <div className="mt-1">
                {groupData.isActive ? (
                  <Badge className="bg-green-500">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Telegram ID:</span>
              <p className="font-mono text-xs mt-1">{groupData.telegramId}</p>
            </div>
          </div>
          {groupData.description && (
            <div>
              <span className="text-muted-foreground text-sm">Description:</span>
              <p className="text-sm mt-1">{groupData.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Bots */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Linked Bots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {linkedBots.length > 0 ? (
            <>
              {linkedBots.map((link: any) => (
                <div
                  key={link.id}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                >
                  <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">
                    @{link.bot?.username || 'Unknown'}
                  </span>
                  <div className="flex items-center gap-1 ml-auto shrink-0">
                    {link.isPrimary && (
                      <Badge className="bg-green-500 text-[10px] px-1.5 py-0">
                        <span className="hidden sm:inline">Primary</span>
                        <Star className="h-3 w-3 sm:hidden" />
                      </Badge>
                    )}
                    {link.isAdmin && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        <span className="hidden sm:inline">Admin</span>
                        <span className="sm:hidden">A</span>
                      </Badge>
                    )}
                    {!link.isPrimary && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setPrimaryMutation.mutate(link.botId)}
                        disabled={setPrimaryMutation.isPending}
                        title="Set as primary"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Unlink bot?',
                          description: 'This will remove the bot from this group.',
                          confirmText: 'Unlink',
                          destructive: true,
                        })
                        if (confirmed) unlinkBotMutation.mutate(link.botId)
                      }}
                      disabled={unlinkBotMutation.isPending}
                      title="Unlink"
                    >
                      <Unlink className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-3">
              <p className="text-sm text-muted-foreground">No bots linked</p>
              <p className="text-xs text-muted-foreground">
                Link a bot to create invite links
              </p>
            </div>
          )}

          {/* Link new bot */}
          {unlinkedBots.length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex flex-wrap gap-1.5">
                {unlinkedBots.map((bot: any) => (
                  <Button
                    key={bot.id}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => linkBotMutation.mutate({
                      botId: bot.id,
                      isPrimary: linkedBots.length === 0
                    })}
                    disabled={linkBotMutation.isPending}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    @{bot.username}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {botsList.length === 0 && (
            <div className="pt-2 border-t text-center">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => router.push('/dashboard/bots/add' as any)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add a Bot
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{invitesList.length}</p>
              <p className="text-xs text-muted-foreground">Invite Links</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{membersList.length}</p>
              <p className="text-xs text-muted-foreground">Tracked Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invites */}
      {invitesList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitesList.slice(0, 5).map((invite: any) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-2 border rounded text-sm"
                >
                  <div>
                    <span className="font-mono text-xs">
                      {invite.token?.substring(0, 8)}...
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {invite.currentUses}/{invite.memberLimit || '∞'} uses
                    </span>
                  </div>
                  <Badge
                    variant={invite.status === 0 ? 'default' : 'secondary'}
                    className={invite.status === 0 ? 'bg-green-500' : ''}
                  >
                    {invite.status === 0 ? 'Active' : invite.status === 1 ? 'Expired' : 'Revoked'}
                  </Badge>
                </div>
              ))}
            </div>
            {invitesList.length > 5 && (
              <Button
                variant="link"
                size="sm"
                className="mt-2 w-full"
                onClick={() => router.push(`/dashboard/invites?groupId=${groupId}` as any)}
              >
                View all {invitesList.length} invites
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
