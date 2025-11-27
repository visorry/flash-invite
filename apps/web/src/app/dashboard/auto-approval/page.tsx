"use client"

import { useSession } from '@/hooks/use-session'
import { useConfirm } from '@/hooks/use-confirm'
import { Button } from '@/components/ui/button'
import { Plus, Power, Trash2, Pencil, UserCheck, Clock, Shield } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function AutoApprovalPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  // Fetch auto-approval rules
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['auto-approval-rules'],
    queryFn: async () => {
      return api.autoApproval.list()
    },
  })

  // Toggle rule mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.autoApproval.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-approval-rules'] })
      toast.success('Rule status updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update rule')
    },
  })

  // Delete rule mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.autoApproval.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-approval-rules'] })
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

  const getApprovalModeLabel = (mode: number) => {
    switch (mode) {
      case 0: return 'Instant'
      case 1: return 'Delayed'
      case 2: return 'Captcha'
      default: return 'Unknown'
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4">
      <ConfirmDialog />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Auto Approval</h1>
          <p className="text-xs text-muted-foreground">
            Automatically approve join requests
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => router.push('/auto-approval/create' as any)}
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
                      <Badge variant="outline" className="text-xs">
                        {rule.approvalMode === 0 && <UserCheck className="h-3 w-3 mr-1" />}
                        {rule.approvalMode === 1 && <Clock className="h-3 w-3 mr-1" />}
                        {rule.approvalMode === 2 && <Shield className="h-3 w-3 mr-1" />}
                        {getApprovalModeLabel(rule.approvalMode)}
                      </Badge>
                      {rule.isActive ? (
                        <Badge className="bg-green-500 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Paused</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="truncate">
                        {rule.telegramEntity?.title || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      @{rule.bot?.username} • {rule.approvedCount} approved • {rule.rejectedCount} rejected
                      {rule.approvalMode === 1 && ` • ${rule.delaySeconds}s delay`}
                    </p>
                    {/* Filters */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {rule.requireUsername && (
                        <Badge variant="outline" className="text-xs">Username required</Badge>
                      )}
                      {rule.requirePremium && (
                        <Badge variant="outline" className="text-xs">Premium only</Badge>
                      )}
                      {rule.minAccountAge && (
                        <Badge variant="outline" className="text-xs">{rule.minAccountAge}d min age</Badge>
                      )}
                    </div>
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
                      onClick={() => router.push(`/auto-approval/${rule.id}/edit` as any)}
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
                          description: 'This will permanently delete this auto-approval rule.',
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
                No auto-approval rules yet
              </p>
              <Button
                size="sm"
                onClick={() => router.push('/auto-approval/create' as any)}
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
          <p>• Auto-approval automatically handles join requests to your groups/channels</p>
          <p>• Set filters like requiring username, premium status, or minimum account age</p>
          <p>• Choose instant approval or add a delay for spam protection</p>
          <p>• Optionally send a welcome message after approval</p>
          <p>• Your bot must be admin with "Add Members" permission</p>
        </CardContent>
      </Card>
    </div>
  )
}
