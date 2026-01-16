"use client"

import { useSession } from '@/hooks/use-session'
import { useConfirm } from '@/hooks/use-confirm'
import { Button } from '@/components/ui/button'
import { Plus, Power, Trash2, BarChart3, Pencil } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function PromoterPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  // Fetch promoter configs
  const { data: configs, isLoading: configsLoading } = useQuery({
    queryKey: ['promoter-configs'],
    queryFn: async () => {
      return api.promoter.list()
    },
  })

  // Toggle config mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.promoter.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoter-configs'] })
      toast.success('Promoter status updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update promoter')
    },
  })

  // Delete config mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.promoter.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoter-configs'] })
      toast.success('Promoter deleted')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete promoter')
    },
  })

  if (isLoading || configsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const configsList = (configs as any) || []

  return (
    <div className="flex-1 space-y-6 p-4">
      <ConfirmDialog />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Promoter 2.0</h1>
          <p className="text-xs text-muted-foreground">
            Content promotion via deep links
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => router.push('/dashboard/promoter/create' as any)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Promoter
        </Button>
      </div>

      {/* Configs List */}
      {configsList.length > 0 ? (
        <div className="space-y-3">
          {configsList.map((config: any) => (
            <Card key={config.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {config.name}
                      </span>
                      {config.isActive ? (
                        <Badge className="bg-green-500 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Paused</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        Vault: {config.vaultGroup?.title || 'Unknown'} → Marketing: {config.marketingGroup?.title || 'Unknown'}
                      </p>
                      <p>
                        @{config.bot?.username} • {config.totalCaptures || 0} captured • {config.totalDeliveries || 0} delivered
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/dashboard/promoter/${config.id}/stats` as any)}
                      title="View Stats"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleMutation.mutate(config.id)}
                      disabled={toggleMutation.isPending}
                      title={config.isActive ? 'Pause' : 'Activate'}
                    >
                      <Power className={`h-4 w-4 ${config.isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/dashboard/promoter/${config.id}/edit` as any)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Delete promoter?',
                          description: 'This will permanently delete this promoter configuration and all associated posts.',
                          confirmText: 'Delete',
                          destructive: true,
                        })
                        if (confirmed) deleteMutation.mutate(config.id)
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
                No promoter configurations yet
              </p>
              <Button
                size="sm"
                onClick={() => router.push('/dashboard/promoter/create' as any)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Promoter
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
          <p>• Vault Group: Bot captures media posts and generates unique tokens</p>
          <p>• Marketing Group: Bot auto-creates promotional posts with deep links</p>
          <p>• Users click deep link → press /start → receive original media</p>
          <p>• Tokens expire after configured days (default: 30)</p>
          <p>• Bot must be admin in both vault and marketing groups</p>
        </CardContent>
      </Card>
    </div>
  )
}
