"use client"

import { useSession } from '@/hooks/use-session'
import { useConfirm } from '@/hooks/use-confirm'
import { Button } from '@/components/ui/button'
import { Bot, Users, Send, Plus, Radio, Clock, CheckCircle, XCircle, Loader2, RotateCcw, Trash2, Copy, Pencil } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

export default function BroadcastPage() {
    const { user, isLoading } = useSession()
    const router = useRouter()
    const queryClient = useQueryClient()
    const { confirm, ConfirmDialog } = useConfirm()
    const [selectedBot, setSelectedBot] = useState<string | null>(null)

    // Fetch bots with subscribers
    const { data: bots, isLoading: botsLoading } = useQuery({
        queryKey: ['broadcast-bots'],
        queryFn: async () => {
            return api.broadcast.listBotsWithSubscribers()
        },
    })

    // Fetch broadcasts for selected bot
    const { data: broadcasts, isLoading: broadcastsLoading } = useQuery({
        queryKey: ['broadcasts', selectedBot],
        queryFn: async () => {
            return api.broadcast.list(selectedBot || undefined)
        },
        enabled: !!selectedBot,
    })

    // Delete broadcast mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.broadcast.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
            toast.success('Broadcast deleted')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete broadcast')
        },
    })

    // Cancel broadcast mutation
    const cancelMutation = useMutation({
        mutationFn: (id: string) => api.broadcast.cancel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
            toast.success('Broadcast cancelled')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to cancel broadcast')
        },
    })

    // Duplicate broadcast mutation (for resend)
    const duplicateMutation = useMutation({
        mutationFn: (id: string) => api.broadcast.duplicate(id),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
            toast.success('Broadcast duplicated! Redirecting to send...')
            router.push(`/dashboard/broadcast/${data.id}/send` as any)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to duplicate broadcast')
        },
    })

    if (isLoading || botsLoading) {
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
    const broadcastList = (broadcasts as any)?.items || []

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0: return <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
            case 1: return <Badge className="bg-blue-500 text-xs"><Loader2 className="h-3 w-3 mr-1 animate-spin" />In Progress</Badge>
            case 2: return <Badge className="bg-green-500 text-xs"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
            case 3: return <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
            case 4: return <Badge variant="secondary" className="text-xs">Cancelled</Badge>
            default: return <Badge variant="outline" className="text-xs">Unknown</Badge>
        }
    }

    return (
        <div className="flex-1 space-y-6 p-4">
            <ConfirmDialog />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <Radio className="h-5 w-5" />
                        Broadcast
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Send messages to your bot subscribers
                    </p>
                </div>
                {selectedBot && (
                    <Button
                        size="sm"
                        onClick={() => router.push(`/dashboard/broadcast/create?botId=${selectedBot}` as any)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Broadcast
                    </Button>
                )}
            </div>

            {/* Bot Selection */}
            <div className="space-y-3">
                <h2 className="text-sm font-medium">Select a Bot</h2>
                {botsList.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {botsList.map((bot: any) => (
                            <Card
                                key={bot.id}
                                className={`cursor-pointer transition-all hover:border-primary ${selectedBot === bot.id ? 'border-primary ring-2 ring-primary/20' : ''
                                    }`}
                                onClick={() => setSelectedBot(bot.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Bot className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{bot.firstName || bot.username || 'Bot'}</p>
                                            <p className="text-xs text-muted-foreground truncate">@{bot.username}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-sm font-medium">
                                                <Users className="h-4 w-4" />
                                                {bot.subscriberCount || 0}
                                            </div>
                                            <p className="text-xs text-muted-foreground">subscribers</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                            {bot.totalMembers || 0} total
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                                            {bot.premiumCount || 0} premium
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                            {bot.blockedCount || 0} blocked
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-8">
                            <div className="text-center">
                                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <p className="text-sm text-muted-foreground mb-2">No bots found</p>
                                <p className="text-xs text-muted-foreground">
                                    Add a bot first to start broadcasting
                                </p>
                                <Button
                                    className="mt-4"
                                    size="sm"
                                    onClick={() => router.push('/dashboard/bots/add' as any)}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Bot
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Selected Bot Actions */}
            {selectedBot && (
                <>
                    {/* Quick Actions */}
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/broadcast/subscribers/${selectedBot}` as any)}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            View Subscribers
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => router.push(`/dashboard/broadcast/create?botId=${selectedBot}` as any)}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Create Broadcast
                        </Button>
                    </div>

                    {/* Broadcasts List */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-medium">Recent Broadcasts</h2>
                        {broadcastsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                        ) : broadcastList.length > 0 ? (
                            <div className="space-y-3">
                                {broadcastList.map((broadcast: any) => (
                                    <Card key={broadcast.id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-sm truncate">
                                                            {broadcast.name || 'Untitled Broadcast'}
                                                        </p>
                                                        {getStatusBadge(broadcast.status)}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {broadcast.content || 'No content'}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                        <span>{broadcast.totalRecipients} recipients</span>
                                                        {broadcast.status === 2 && (
                                                            <>
                                                                <span className="text-green-500">{broadcast.sentCount} sent</span>
                                                                {broadcast.failedCount > 0 && (
                                                                    <span className="text-red-500">{broadcast.failedCount} failed</span>
                                                                )}
                                                            </>
                                                        )}
                                                        <span>{new Date(broadcast.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 ml-2">
                                                    {/* Pending - show send button */}
                                                    {broadcast.status === 0 && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Send broadcast"
                                                            onClick={() => router.push(`/dashboard/broadcast/${broadcast.id}/send` as any)}
                                                        >
                                                            <Send className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {/* Pending or In Progress - show cancel button */}
                                                    {(broadcast.status === 0 || broadcast.status === 1) && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Cancel broadcast"
                                                            onClick={async () => {
                                                                const confirmed = await confirm({
                                                                    title: 'Cancel broadcast?',
                                                                    description: 'This will cancel the broadcast.',
                                                                    confirmText: 'Cancel',
                                                                    destructive: true,
                                                                })
                                                                if (confirmed) cancelMutation.mutate(broadcast.id)
                                                            }}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {/* Completed/Failed/Cancelled - show resend (duplicate) button */}
                                                    {(broadcast.status === 2 || broadcast.status === 3 || broadcast.status === 4) && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Resend (create copy)"
                                                            onClick={() => duplicateMutation.mutate(broadcast.id)}
                                                            disabled={duplicateMutation.isPending}
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {/* Completed/Failed/Cancelled - show duplicate (copy with edit) button */}
                                                    {(broadcast.status === 2 || broadcast.status === 3 || broadcast.status === 4) && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Edit and resend"
                                                            onClick={() => router.push(`/dashboard/broadcast/${broadcast.id}/edit` as any)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {/* Not in progress - show delete button */}
                                                    {broadcast.status !== 1 && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Delete broadcast"
                                                            onClick={async () => {
                                                                const confirmed = await confirm({
                                                                    title: 'Delete broadcast?',
                                                                    description: 'This action cannot be undone.',
                                                                    confirmText: 'Delete',
                                                                    destructive: true,
                                                                })
                                                                if (confirmed) deleteMutation.mutate(broadcast.id)
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
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
                                        <Send className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                                        <p className="text-sm text-muted-foreground mb-3">No broadcasts yet</p>
                                        <Button
                                            size="sm"
                                            onClick={() => router.push(`/dashboard/broadcast/create?botId=${selectedBot}` as any)}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create First Broadcast
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </>
            )}

            {/* Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">How it works</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                    <p>• Select a bot to see its subscribers and create broadcasts</p>
                    <p>• Subscribers are users who have started your bot</p>
                    <p>• You can filter recipients by activity, premium status, language</p>
                    <p>• Add watermarks to your messages for branding</p>
                    <p>• Forward posts from source groups to all subscribers</p>
                </CardContent>
            </Card>
        </div>
    )
}
