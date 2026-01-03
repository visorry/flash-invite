"use client"

import { useSession } from '@/hooks/use-session'
import { useConfirm } from '@/hooks/use-confirm'
import { Button } from '@/components/ui/button'
import { Plus, Power, Trash2, Pencil, Terminal, RotateCcw } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function AutoDropPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  // Fetch auto drop rules
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['auto-drop-rules'],
    queryFn: async () => {
      return api.autoDrop.list()
    },
  })

  // Toggle rule mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.autoDrop.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-drop-rules'] })
      toast.success('Rule status updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update rule')
    },
  })

  // Reset rule mutation
  const resetMutation = useMutation({
    mutationFn: (id: string) => api.autoDrop.reset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-drop-rules'] })
      toast.success('Rule reset successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset rule')
    },
  })

  // Delete rule mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.autoDrop.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-drop-rules'] })
      toast.success('Rule deleted')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete rule')
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
          <h1 className="text-lg font-semibold">Auto Drop</h1>
          <p className="text-xs text-muted-foreground">
            Send posts to users on command
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => router.push('/dashboard/auto-drop/create' as any)}
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
                      <Badge variant="outline" className="text-xs font-mono">
                        <Terminal className="h-3 w-3 mr-1" />
                        {rule.command}
                      </Badge>
                      {rule.isActive ? (
                        <Badge className="bg-green-500 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Paused</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Source: {rule.sourceEntity?.title || 'Unknown'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      @{rule.bot?.username} • {rule.totalDrops} drops
                      {rule.rateLimitEnabled && (
                        <> • {rule.rateLimitCount} req/{rule.rateLimitWindow}s</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleMutation.mutate(rule.id)}
                      disabled={toggleMutation.isPending}
                      title={rule.isActive ? 'Pause' : 'Activate'}
                    >
                      <Power className={`h-4 w-4 ${rule.isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Reset rule?',
                          description: 'This will reset all user progress and drop statistics for this rule.',
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/dashboard/auto-drop/${rule.id}/edit` as any)}
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
                          description: 'This will permanently delete this auto drop rule.',
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
                No auto drop rules yet
              </p>
              <Button
                size="sm"
                onClick={() => router.push('/dashboard/auto-drop/create' as any)}
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
          <p>• Users send a command (e.g., /drop, /post) to your bot</p>
          <p>• Bot sends posts from the source channel to the user</p>
          <p>• Rate limiting prevents spam and abuse</p>
          <p>• Configure how many posts to send per command</p>
          <p>• Filter content types and add modifications</p>
        </CardContent>
      </Card>
    </div>
  )
}
