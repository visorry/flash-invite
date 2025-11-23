"use client"

import { useSession } from '@/hooks/use-session'
import { useConfirm } from '@/hooks/use-confirm'
import { Button } from '@/components/ui/button'
import { ArrowRight, Plus, Power, Trash2, Play, Pause, RotateCcw, Clock, Pencil } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function ForwardRulesPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  // Fetch forward rules
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['forward-rules'],
    queryFn: async () => {
      return api.forwardRules.list()
    },
  })

  // Toggle rule mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.forwardRules.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forward-rules'] })
      toast.success('Rule status updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update rule')
    },
  })

  // Delete rule mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.forwardRules.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forward-rules'] })
      toast.success('Rule deleted')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete rule')
    },
  })

  // Start scheduled rule
  const startMutation = useMutation({
    mutationFn: (id: string) => api.forwardRules.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forward-rules'] })
      toast.success('Scheduler started')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start scheduler')
    },
  })

  // Pause scheduled rule
  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.forwardRules.pause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forward-rules'] })
      toast.success('Scheduler paused')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to pause scheduler')
    },
  })

  // Resume scheduled rule
  const resumeMutation = useMutation({
    mutationFn: (id: string) => api.forwardRules.resume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forward-rules'] })
      toast.success('Scheduler resumed')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to resume scheduler')
    },
  })

  // Reset scheduled rule
  const resetMutation = useMutation({
    mutationFn: (id: string) => api.forwardRules.reset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forward-rules'] })
      toast.success('Scheduler reset')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset scheduler')
    },
  })

  if (isLoading || rulesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const rulesList = (rules as any) || []

  return (
    <div className="flex-1 space-y-6 p-4">
      <ConfirmDialog />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Forward Rules</h1>
          <p className="text-xs text-muted-foreground">
            Auto-forward messages between channels/groups
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => router.push('/forward-rules/create' as any)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      {/* Rules List */}
      {rulesList.length > 0 ? (
        <div className="space-y-3">
          {rulesList.map((rule: any) => (
            <Card key={rule.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {rule.name}
                      </span>
                      {rule.scheduleMode === 1 ? (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Scheduled
                        </Badge>
                      ) : null}
                      {rule.isActive ? (
                        <Badge className="bg-green-500 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Paused</Badge>
                      )}
                      {rule.scheduleMode === 1 && rule.scheduleStatus === 1 && (
                        <Badge className="bg-blue-500 text-xs">Running</Badge>
                      )}
                      {rule.scheduleMode === 1 && rule.scheduleStatus === 2 && (
                        <Badge variant="outline" className="text-xs">Paused</Badge>
                      )}
                      {rule.scheduleMode === 1 && rule.scheduleStatus === 3 && (
                        <Badge variant="secondary" className="text-xs">Completed</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="truncate max-w-[100px]">
                        {rule.sourceEntity?.title || 'Unknown'}
                      </span>
                      <ArrowRight className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate max-w-[100px]">
                        {rule.destinationEntity?.title || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      @{rule.bot?.username} • {rule.forwardedCount} forwarded
                      {rule.scheduleMode === 1 && rule.messageQueue?.length > 0 && (
                        <> • {rule.messageQueue.length} queued</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {/* Scheduled mode controls */}
                    {rule.scheduleMode === 1 && (
                      <>
                        {rule.scheduleStatus === 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startMutation.mutate(rule.id)}
                            disabled={startMutation.isPending}
                            title="Start"
                          >
                            <Play className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        {rule.scheduleStatus === 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => pauseMutation.mutate(rule.id)}
                            disabled={pauseMutation.isPending}
                            title="Pause"
                          >
                            <Pause className="h-4 w-4 text-yellow-500" />
                          </Button>
                        )}
                        {rule.scheduleStatus === 2 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resumeMutation.mutate(rule.id)}
                            disabled={resumeMutation.isPending}
                            title="Resume"
                          >
                            <Play className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        {(rule.scheduleStatus === 3 || rule.scheduleStatus === 1 || rule.scheduleStatus === 2) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              const confirmed = await confirm({
                                title: 'Reset scheduler?',
                                description: 'This will reset progress. All forwarded messages will start from the beginning.',
                                confirmText: 'Reset',
                                destructive: true,
                              })
                              if (confirmed) resetMutation.mutate(rule.id)
                            }}
                            disabled={resetMutation.isPending}
                            title="Reset"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                    {/* Realtime mode controls */}
                    {rule.scheduleMode === 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleMutation.mutate(rule.id)}
                        disabled={toggleMutation.isPending}
                        title={rule.isActive ? 'Pause' : 'Activate'}
                      >
                        <Power className={`h-4 w-4 ${rule.isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/forward-rules/${rule.id}/edit` as any)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Delete rule?',
                          description: 'This will permanently delete this forward rule.',
                          confirmText: 'Delete',
                          destructive: true,
                        })
                        if (confirmed) deleteMutation.mutate(rule.id)
                      }}
                      disabled={deleteMutation.isPending}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No forward rules yet
              </p>
              <Button
                size="sm"
                onClick={() => router.push('/forward-rules/create' as any)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>• Forward rules automatically copy messages from one channel/group to another</p>
          <p>• Your bot must be admin in the destination to send messages</p>
          <p>• Filter by content type (media, text, documents, etc.)</p>
          <p>• Use keywords to forward only relevant messages</p>
          <p>• Optionally remove links or add watermarks</p>
        </CardContent>
      </Card>
    </div>
  )
}
