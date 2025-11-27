"use client"

import { useSession } from '@/hooks/use-session'
import { useConfirm } from '@/hooks/use-confirm'
import { Button } from '@/components/ui/button'
import { Plus, Bot, Star, Trash2, RefreshCw } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function BotsPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  // Fetch bots
  const { data: bots, isLoading: botsLoading } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      return api.bots.list()
    },
  })

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => api.bots.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast.success('Default bot updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set default bot')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.bots.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast.success('Bot removed successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove bot')
    },
  })

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: (id: string) => api.bots.syncChats(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast.success('Bot chats synced')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sync chats')
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

  const botsList = (bots as any) || []

  return (
    <div className="flex-1 space-y-6 p-4">
      <ConfirmDialog />
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold">My Bots</h1>
          <p className="text-xs text-muted-foreground">
            Manage your Telegram bots
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/bots/add' as any)} size="sm" className="shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="sm:inline">Add Bot</span>
        </Button>
      </div>

      {/* Bots List */}
      {botsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : botsList.length > 0 ? (
        <div className="space-y-3">
          {botsList.map((bot: any) => (
            <Card key={bot.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      @{bot.username}
                      {bot.isDefault && (
                        <Badge className="bg-yellow-500">
                          <Star className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Default</span>
                        </Badge>
                      )}
                      {bot.status === 0 ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : bot.status === 2 ? (
                        <Badge variant="destructive">Error</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {bot.firstName}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => syncMutation.mutate(bot.id)}
                      disabled={syncMutation.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                    {!bot.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDefaultMutation.mutate(bot.id)}
                        disabled={setDefaultMutation.isPending}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Remove bot?',
                          description: 'This will remove the bot from your account. You can re-add it later.',
                          confirmText: 'Remove',
                          destructive: true,
                        })
                        if (confirmed) deleteMutation.mutate(bot.id)
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{bot._count?.entityLinks || 0} groups linked</span>
                  <span>{bot._count?.inviteLinks || 0} invite links</span>
                  <span>{bot._count?.botMembers || 0} members</span>
                </div>

                {/* Error message */}
                {bot.errorMessage && (
                  <p className="text-xs text-destructive">
                    Error: {bot.errorMessage}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => router.push(`/dashboard/bots/${bot.id}` as any)}
                  >
                    View Details
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
            <p className="text-sm text-muted-foreground mb-4">No bots added yet</p>
            <p className="text-xs text-muted-foreground mb-4 text-center max-w-sm">
              Add your Telegram bot to start creating invite links and managing groups.
              Your first bot is free!
            </p>
            <Button onClick={() => router.push('/dashboard/bots/add' as any)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Bot
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
