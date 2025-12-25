'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Play, Pause, Square, RotateCcw, Edit, Trash2, Settings } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface AutoDropRule {
  id: string
  name: string
  isActive: boolean
  status: string
  startPostId?: number
  endPostId?: number
  currentPostId?: number
  batchSize: number
  dropInterval: number
  dropUnit: number
  droppedCount: number
  lastDroppedAt?: string
  delayText: string
  bot: {
    id: string
    username: string
  }
  telegramEntity: {
    id: string
    title: string
    username?: string
    type: number
  }
  createdAt: string
}

const statusColors = {
  stopped: 'bg-gray-500',
  running: 'bg-green-500',
  paused: 'bg-yellow-500',
  completed: 'bg-blue-500',
}

const statusLabels = {
  stopped: 'Stopped',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
}

export default function AutoDropPage() {
  const queryClient = useQueryClient()

  const { data: rules, isLoading } = useQuery({
    queryKey: ['auto-drop-rules'],
    queryFn: () => api.autoDrop.list(),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.autoDrop.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-drop-rules'] })
      toast.success('Rule status updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update rule status')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.autoDrop.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-drop-rules'] })
      toast.success('Rule deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete rule')
    },
  })

  const startMutation = useMutation({
    mutationFn: (id: string) => api.autoDrop.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-drop-rules'] })
      toast.success('Auto-drop started')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start auto-drop')
    },
  })

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.autoDrop.pause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-drop-rules'] })
      toast.success('Auto-drop paused')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to pause auto-drop')
    },
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => api.autoDrop.resume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-drop-rules'] })
      toast.success('Auto-drop resumed')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to resume auto-drop')
    },
  })

  const resetMutation = useMutation({
    mutationFn: (id: string) => api.autoDrop.reset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-drop-rules'] })
      toast.success('Auto-drop reset')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset auto-drop')
    },
  })

  const handleStart = (rule: AutoDropRule) => {
    if (!rule.isActive) {
      toast.error('Rule must be active to start')
      return
    }
    startMutation.mutate(rule.id)
  }

  const handlePause = (rule: AutoDropRule) => {
    pauseMutation.mutate(rule.id)
  }

  const handleResume = (rule: AutoDropRule) => {
    resumeMutation.mutate(rule.id)
  }

  const handleReset = (rule: AutoDropRule) => {
    resetMutation.mutate(rule.id)
  }

  const getProgress = (rule: AutoDropRule) => {
    if (!rule.startPostId || !rule.endPostId || !rule.currentPostId) return 0
    const total = rule.endPostId - rule.startPostId + 1
    const current = rule.currentPostId - rule.startPostId + 1
    return Math.min(100, Math.max(0, (current / total) * 100))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auto Drop</h1>
          <p className="text-muted-foreground">
            Send posts from source groups to users on-demand. Users get posts instantly with the /post command.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/auto-drop/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Rule
          </Link>
        </Button>
      </div>

      {!rules || !Array.isArray(rules) || rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Auto Drop Rules</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first auto drop rule to enable on-demand post delivery. Users get posts instantly using the /post command.
            </p>
            <Button asChild>
              <Link href="/dashboard/auto-drop/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Rule
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {Array.isArray(rules) && rules.map((rule: AutoDropRule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {rule.name}
                      <Badge
                        variant={rule.isActive ? 'default' : 'secondary'}
                        className={rule.isActive ? 'bg-green-500' : ''}
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`${statusColors[rule.status as keyof typeof statusColors]} text-white`}
                      >
                        {statusLabels[rule.status as keyof typeof statusLabels]}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Bot: @{rule.bot.username} → Source: {rule.telegramEntity.title}
                      {rule.telegramEntity.username && ` (@${rule.telegramEntity.username})`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {rule.status === 'stopped' && rule.isActive && (
                      <Button
                        size="sm"
                        onClick={() => handleStart(rule)}
                        disabled={startMutation.isPending}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {rule.status === 'running' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePause(rule)}
                        disabled={pauseMutation.isPending}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {rule.status === 'paused' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleResume(rule)}
                          disabled={resumeMutation.isPending}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReset(rule)}
                          disabled={resetMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {rule.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReset(rule)}
                        disabled={resetMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleMutation.mutate(rule.id)}
                      disabled={toggleMutation.isPending}
                    >
                      {rule.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/auto-drop/${rule.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Auto Drop Rule</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{rule.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(rule.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Post Range</p>
                    <p className="font-medium">
                      {rule.startPostId || 'Start'} - {rule.endPostId || 'End'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Position</p>
                    <p className="font-medium">{rule.currentPostId || 'Not started'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Batch Size</p>
                    <p className="font-medium">{rule.batchSize} posts</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Interval</p>
                    <p className="font-medium">{rule.delayText}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dropped Count</p>
                    <p className="font-medium">{rule.droppedCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Dropped</p>
                    <p className="font-medium">
                      {rule.lastDroppedAt
                        ? new Date(rule.lastDroppedAt).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Progress</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${getProgress(rule)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{Math.round(getProgress(rule))}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}