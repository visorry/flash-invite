"use client"

import { useSession } from '@/hooks/use-session'
import { useConfirm } from '@/hooks/use-confirm'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Send, CheckCircle, XCircle, Loader2, Users, Clock, Wand2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function SendBroadcastPage() {
    const { user, isLoading } = useSession()
    const router = useRouter()
    const params = useParams()
    const queryClient = useQueryClient()
    const { confirm, ConfirmDialog } = useConfirm()
    const broadcastId = params.id as string

    // Fetch broadcast details
    const { data: broadcast, isLoading: broadcastLoading, refetch } = useQuery({
        queryKey: ['broadcast', broadcastId],
        queryFn: async () => {
            return api.broadcast.getById(broadcastId)
        },
        enabled: !!broadcastId,
        refetchInterval: (data: any) => {
            // Keep polling if broadcast is in progress
            if (data?.status === 1) return 2000
            return false
        },
    })

    // Send mutation
    const sendMutation = useMutation({
        mutationFn: () => api.broadcast.send(broadcastId),
        onSuccess: () => {
            toast.success('Broadcast started!')
            refetch()
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to start broadcast')
        },
    })

    // Cancel mutation
    const cancelMutation = useMutation({
        mutationFn: () => api.broadcast.cancel(broadcastId),
        onSuccess: () => {
            toast.success('Broadcast cancelled')
            router.push('/dashboard/broadcast' as any)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to cancel broadcast')
        },
    })

    if (isLoading || broadcastLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    const broadcastData = broadcast as any

    if (!broadcastData) {
        return (
            <div className="flex-1 p-4">
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Broadcast not found</p>
                            <Button
                                className="mt-4"
                                size="sm"
                                onClick={() => router.push('/dashboard/broadcast' as any)}
                            >
                                Back to Broadcasts
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

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

    const handleSend = async () => {
        const confirmed = await confirm({
            title: 'Send Broadcast?',
            description: `This will send messages to ${broadcastData.totalRecipients} subscribers. This action cannot be undone.`,
            confirmText: 'Send Now',
            destructive: false,
        })
        if (confirmed) {
            sendMutation.mutate()
        }
    }

    const handleCancel = async () => {
        const confirmed = await confirm({
            title: 'Cancel Broadcast?',
            description: 'This will cancel the broadcast.',
            confirmText: 'Cancel Broadcast',
            destructive: true,
        })
        if (confirmed) {
            cancelMutation.mutate()
        }
    }

    const progress = broadcastData.totalRecipients > 0
        ? Math.round(((broadcastData.sentCount + broadcastData.failedCount + (broadcastData.blockedCount || 0)) / broadcastData.totalRecipients) * 100)
        : 0

    return (
        <div className="flex-1 space-y-6 p-4 max-w-2xl mx-auto">
            <ConfirmDialog />

            {/* Header */}
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push('/dashboard/broadcast' as any)}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        {broadcastData.name || 'Broadcast'}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        @{broadcastData.bot?.username}
                    </p>
                </div>
                {getStatusBadge(broadcastData.status)}
            </div>

            {/* Status Card */}
            {broadcastData.status === 0 && (
                <Card className="border-primary">
                    <CardContent className="p-6">
                        <div className="text-center space-y-4">
                            <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                                <Send className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Ready to Send</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    This broadcast will be sent to {broadcastData.totalRecipients} subscribers
                                </p>
                            </div>
                            <div className="flex gap-2 justify-center">
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={cancelMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSend}
                                    disabled={sendMutation.isPending}
                                    className="min-w-[120px]"
                                >
                                    {sendMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Send Now
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {broadcastData.status === 1 && (
                <Card className="border-blue-500">
                    <CardContent className="p-6">
                        <div className="text-center space-y-4">
                            <div className="h-16 w-16 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Broadcasting...</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Sending messages to {broadcastData.totalRecipients} subscribers
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-2">
                                <div className="h-3 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {progress}% complete ({broadcastData.sentCount + broadcastData.failedCount + (broadcastData.blockedCount || 0)} / {broadcastData.totalRecipients})
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                disabled={cancelMutation.isPending}
                            >
                                Cancel Broadcast
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {broadcastData.status === 2 && (
                <Card className="border-green-500">
                    <CardContent className="p-6">
                        <div className="text-center space-y-4">
                            <div className="h-16 w-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-green-600">Broadcast Complete!</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Successfully sent to {broadcastData.sentCount} subscribers
                                </p>
                            </div>
                            <Button onClick={() => router.push('/dashboard/broadcast' as any)}>
                                Back to Broadcasts
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {broadcastData.status === 3 && (
                <Card className="border-destructive">
                    <CardContent className="p-6">
                        <div className="text-center space-y-4">
                            <div className="h-16 w-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                                <XCircle className="h-8 w-8 text-destructive" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-destructive">Broadcast Failed</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    The broadcast could not be completed
                                </p>
                            </div>
                            <Button onClick={() => router.push('/dashboard/broadcast' as any)}>
                                Back to Broadcasts
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                        <p className="text-xl font-bold">{broadcastData.totalRecipients}</p>
                        <p className="text-xs text-muted-foreground">Recipients</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-1" />
                        <p className="text-xl font-bold text-green-600">{broadcastData.sentCount}</p>
                        <p className="text-xs text-muted-foreground">Sent</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <XCircle className="h-5 w-5 mx-auto text-red-500 mb-1" />
                        <p className="text-xl font-bold text-red-600">{broadcastData.failedCount}</p>
                        <p className="text-xs text-muted-foreground">Failed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <XCircle className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                        <p className="text-xl font-bold text-orange-600">{broadcastData.blockedCount || 0}</p>
                        <p className="text-xs text-muted-foreground">Blocked</p>
                    </CardContent>
                </Card>
            </div>

            {/* Message Preview */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Message Content</CardTitle>
                </CardHeader>
                <CardContent>
                    {broadcastData.content ? (
                        <div className="bg-muted p-3 rounded-lg">
                            <pre className="text-sm whitespace-pre-wrap font-sans">
                                {broadcastData.content}
                            </pre>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No text content</p>
                    )}
                </CardContent>
            </Card>

            {/* Settings Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Parse Mode</span>
                        <span>{broadcastData.parseMode || 'Plain Text'}</span>
                    </div>
                    {broadcastData.watermarkEnabled && (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Wand2 className="h-3 w-3" />
                                Watermark
                            </span>
                            <span>{broadcastData.watermarkText}</span>
                        </div>
                    )}
                    {broadcastData.sourceGroupId && (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Source Group</span>
                            <Badge variant="outline">{broadcastData.sourceGroupId}</Badge>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span>{new Date(broadcastData.createdAt).toLocaleString()}</span>
                    </div>
                    {broadcastData.completedAt && (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Completed</span>
                            <span>{new Date(broadcastData.completedAt).toLocaleString()}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
