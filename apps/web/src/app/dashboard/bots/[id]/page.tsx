"use client"

import { useSession } from '@/hooks/use-session'
import { useConfirm } from '@/hooks/use-confirm'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bot, RefreshCw, Star, Users, Link as LinkIcon, Unlink } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function BotDetailsPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()
  const botId = params.id as string

  // Fetch bot details
  const { data: bot, isLoading: botLoading } = useQuery({
    queryKey: ['bot', botId],
    queryFn: async () => {
      return api.bots.getById(botId)
    },
  })

  // Fetch bot chats
  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ['bot-chats', botId],
    queryFn: async () => {
      return api.bots.getChats(botId)
    },
  })

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: () => api.bots.setDefault(botId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', botId] })
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast.success('Bot set as default')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set default bot')
    },
  })

  // Sync chats mutation
  const syncMutation = useMutation({
    mutationFn: () => api.bots.syncChats(botId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-chats', botId] })
      toast.success('Chats synced')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sync chats')
    },
  })

  // Set primary mutation
  const setPrimaryMutation = useMutation({
    mutationFn: (entityId: string) => api.bots.linkToEntity(botId, entityId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-chats', botId] })
      toast.success('Set as primary bot for this group')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set as primary')
    },
  })

  // Unlink mutation
  const unlinkMutation = useMutation({
    mutationFn: (entityId: string) => api.bots.unlinkFromEntity(botId, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-chats', botId] })
      toast.success('Bot unlinked from group')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unlink bot')
    },
  })

  if (isLoading || botLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !bot) {
    return null
  }

  const botData = bot as any
  const chatsList = (chats as any) || []

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
            @{botData.username}
          </h1>
          <p className="text-xs text-muted-foreground">
            {botData.firstName}
          </p>
        </div>
        {!botData.isDefault && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDefaultMutation.mutate()}
            disabled={setDefaultMutation.isPending}
          >
            <Star className="w-4 h-4 mr-2" />
            Set Default
          </Button>
        )}
      </div>

      {/* Bot Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Bot Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>
              <div className="mt-1">
                {botData.status === 0 ? (
                  <Badge className="bg-green-500">Active</Badge>
                ) : botData.status === 2 ? (
                  <Badge variant="destructive">Error</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Default:</span>
              <div className="mt-1">
                {botData.isDefault ? (
                  <Badge className="bg-yellow-500">
                    <Star className="h-3 w-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Bot ID:</span>
              <p className="font-mono text-xs mt-1">{botData.botId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Health Check:</span>
              <p className="text-xs mt-1">
                {botData.lastHealthCheck
                  ? new Date(botData.lastHealthCheck).toLocaleString()
                  : 'Never'
                }
              </p>
            </div>
          </div>

          {botData.errorMessage && (
            <div className="mt-3 p-3 bg-destructive/10 rounded-md">
              <p className="text-xs text-destructive">
                Error: {botData.errorMessage}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Groups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Linked Groups</CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {chatsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : chatsList.length > 0 ? (
            <div className="space-y-3">
              {chatsList.map((link: any) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {link.telegramEntity?.title || 'Unknown'}
                      </span>
                      {link.isPrimary && (
                        <Badge className="bg-green-500 text-xs">Primary</Badge>
                      )}
                      {link.isAdmin && (
                        <Badge variant="outline" className="text-xs">Admin</Badge>
                      )}
                    </div>
                    {link.telegramEntity?.username && (
                      <p className="text-xs text-muted-foreground">
                        @{link.telegramEntity.username}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!link.isPrimary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPrimaryMutation.mutate(link.telegramEntityId)}
                        disabled={setPrimaryMutation.isPending}
                        title="Set as primary"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Unlink bot?',
                          description: 'This will remove the bot from this group.',
                          confirmText: 'Unlink',
                          destructive: true,
                        })
                        if (confirmed) unlinkMutation.mutate(link.telegramEntityId)
                      }}
                      disabled={unlinkMutation.isPending}
                      title="Unlink"
                    >
                      <Unlink className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No groups linked</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add this bot as admin to your groups, then link them here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{botData._count?.entityLinks || 0}</p>
              <p className="text-xs text-muted-foreground">Groups</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{botData._count?.inviteLinks || 0}</p>
              <p className="text-xs text-muted-foreground">Invites</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{botData._count?.botMembers || 0}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
