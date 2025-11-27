'use client'

import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { RefreshCw, Activity, AlertCircle, CheckCircle, Loader2, Server, Wifi, WifiOff } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface Bot {
    id: string
    username: string
    telegramBotId: string
    userId: string
    mode: 'polling' | 'webhook'
    healthStatus: 'healthy' | 'unhealthy' | 'checking'
    lastHealthCheck: string
    groupCount: number
}

interface Stats {
    totalBots: number
    active: number
    unhealthy: number
    checking: number
    polling: number
    webhook: number
}

export default function BotManagementPage() {
    const { user, isLoading: sessionLoading } = useSession()
    const [selectedBots, setSelectedBots] = useState<Set<string>>(new Set())
    const [filter, setFilter] = useState<'all' | 'healthy' | 'unhealthy' | 'checking'>('all')
    const [modeFilter, setModeFilter] = useState<'all' | 'polling' | 'webhook'>('all')
    const [sortBy, setSortBy] = useState<'username' | 'healthStatus' | 'mode' | 'groupCount'>('username')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [showResyncDialog, setShowResyncDialog] = useState(false)

    // Fetch bots using API client
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['admin', 'bot-admin', filter, modeFilter, sortBy, sortOrder],
        queryFn: async () => {
            return api.admin.botAdmin.list({
                healthStatus: filter !== 'all' ? filter : undefined,
                mode: modeFilter !== 'all' ? modeFilter : undefined,
                sortBy,
                sortOrder,
            })
        },
        refetchInterval: 30000, // Auto-refresh every 30 seconds
    })

    const bots: Bot[] = (data as any)?.bots || []
    const stats: Stats | null = (data as any)?.stats || null

    async function forceHealthCheck() {
        setActionLoading('health-check')
        try {
            await api.admin.botAdmin.healthCheck()
            toast.success('Health check completed')
            refetch()
        } catch (error) {
            toast.error('Failed to run health check')
        } finally {
            setActionLoading(null)
        }
    }

    async function restartBot(botId: string) {
        setActionLoading(`restart-${botId}`)
        try {
            await api.admin.botAdmin.restartBot(botId)
            toast.success('Bot restarted successfully')
            refetch()
        } catch (error) {
            toast.error('Failed to restart bot')
        } finally {
            setActionLoading(null)
        }
    }

    async function restartSelected() {
        if (selectedBots.size === 0) return
        setActionLoading('restart-multiple')
        try {
            await api.admin.botAdmin.restartMultiple(Array.from(selectedBots))
            toast.success(`Restarted ${selectedBots.size} bot(s)`)
            setSelectedBots(new Set())
            refetch()
        } catch (error) {
            toast.error('Failed to restart bots')
        } finally {
            setActionLoading(null)
        }
    }

    async function restartUnhealthy() {
        setActionLoading('restart-unhealthy')
        try {
            const result = await api.admin.botAdmin.restartUnhealthy()
            toast.success(`Restarted ${(result as any).restarted} unhealthy bot(s)`)
            refetch()
        } catch (error) {
            toast.error('Failed to restart unhealthy bots')
        } finally {
            setActionLoading(null)
        }
    }

    async function handleResyncAll() {
        setShowResyncDialog(false)
        setActionLoading('resync-all')
        try {
            const result = await api.admin.botAdmin.resyncAll()
            toast.success(`Resynced ${(result as any).restarted}/${(result as any).total} bot(s)`)
            refetch()
        } catch (error) {
            toast.error('Failed to resync bots')
        } finally {
            setActionLoading(null)
        }
    }

    function toggleBotSelection(botId: string) {
        const newSelected = new Set(selectedBots)
        if (newSelected.has(botId)) {
            newSelected.delete(botId)
        } else {
            newSelected.add(botId)
        }
        setSelectedBots(newSelected)
    }

    function toggleSelectAll() {
        if (selectedBots.size === bots.length) {
            setSelectedBots(new Set())
        } else {
            setSelectedBots(new Set(bots.map(b => b.id)))
        }
    }

    const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'healthy': return 'default'
            case 'unhealthy': return 'destructive'
            case 'checking': return 'secondary'
            default: return 'outline'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle className="h-3 w-3" />
            case 'unhealthy': return <AlertCircle className="h-3 w-3" />
            case 'checking': return <Loader2 className="h-3 w-3 animate-spin" />
            default: return null
        }
    }

    if (sessionLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="flex-1 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Bot Management</h1>
                <p className="text-muted-foreground">
                    Monitor and manage all Telegram bots
                </p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total</p>
                                    <p className="text-2xl font-bold">{stats.totalBots}</p>
                                </div>
                                <Server className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Healthy</p>
                                    <p className="text-2xl font-bold">{stats.active}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Unhealthy</p>
                                    <p className="text-2xl font-bold">{stats.unhealthy}</p>
                                </div>
                                <AlertCircle className="h-8 w-8 text-destructive opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Checking</p>
                                    <p className="text-2xl font-bold">{stats.checking}</p>
                                </div>
                                <Activity className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Webhook</p>
                                    <p className="text-2xl font-bold">{stats.webhook}</p>
                                </div>
                                <Wifi className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Polling</p>
                                    <p className="text-2xl font-bold">{stats.polling}</p>
                                </div>
                                <WifiOff className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Actions */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={forceHealthCheck}
                            disabled={actionLoading === 'health-check'}
                            variant="default"
                            size="sm"
                        >
                            {actionLoading === 'health-check' ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Activity className="h-4 w-4 mr-2" />
                            )}
                            Health Check
                        </Button>

                        <Button
                            onClick={restartUnhealthy}
                            disabled={actionLoading === 'restart-unhealthy' || stats?.unhealthy === 0}
                            variant="outline"
                            size="sm"
                        >
                            {actionLoading === 'restart-unhealthy' ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Restart Unhealthy ({stats?.unhealthy || 0})
                        </Button>

                        <Button
                            onClick={restartSelected}
                            disabled={actionLoading === 'restart-multiple' || selectedBots.size === 0}
                            variant="outline"
                            size="sm"
                        >
                            {actionLoading === 'restart-multiple' ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Restart Selected ({selectedBots.size})
                        </Button>

                        <Button
                            onClick={() => setShowResyncDialog(true)}
                            disabled={actionLoading === 'resync-all'}
                            variant="destructive"
                            size="sm"
                        >
                            {actionLoading === 'resync-all' ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Resync All
                        </Button>

                        <Button
                            onClick={() => refetch()}
                            disabled={isLoading}
                            variant="outline"
                            size="sm"
                            className="ml-auto"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Health Status</label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as any)}
                                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="all">All Status</option>
                                <option value="healthy">Healthy Only</option>
                                <option value="unhealthy">Unhealthy Only</option>
                                <option value="checking">Checking Only</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Mode</label>
                            <select
                                value={modeFilter}
                                onChange={(e) => setModeFilter(e.target.value as any)}
                                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="all">All Modes</option>
                                <option value="webhook">Webhook Only</option>
                                <option value="polling">Polling Only</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="username">Username</option>
                                <option value="healthStatus">Health Status</option>
                                <option value="mode">Mode</option>
                                <option value="groupCount">Group Count</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Order</label>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as any)}
                                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bots List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : bots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bots.map((bot) => (
                        <Card key={bot.id}>
                            <CardHeader>
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedBots.has(bot.id)}
                                        onChange={() => toggleBotSelection(bot.id)}
                                        className="h-4 w-4 rounded border-input"
                                    />
                                    <Server className="h-5 w-5" />
                                    @{bot.username}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Bot ID</span>
                                    <span className="font-medium text-xs">{bot.telegramBotId}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Mode</span>
                                    <Badge variant="outline" className="gap-1">
                                        {bot.mode === 'webhook' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                                        {bot.mode}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant={getStatusVariant(bot.healthStatus)} className="gap-1">
                                        {getStatusIcon(bot.healthStatus)}
                                        {bot.healthStatus}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Groups</span>
                                    <span className="font-semibold">{bot.groupCount}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm pt-2 border-t">
                                    <span className="text-muted-foreground text-xs">Last Check</span>
                                    <span className="text-xs">
                                        {bot.lastHealthCheck ? new Date(bot.lastHealthCheck).toLocaleString() : 'Never'}
                                    </span>
                                </div>

                                <div className="pt-2 border-t">
                                    <Button
                                        onClick={() => restartBot(bot.id)}
                                        disabled={actionLoading === `restart-${bot.id}`}
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                    >
                                        {actionLoading === `restart-${bot.id}` ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                        )}
                                        Restart Bot
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Server className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <p className="text-sm text-muted-foreground">No bots found</p>
                    </CardContent>
                </Card>
            )}

            {/* Footer */}
            <div className="text-sm text-muted-foreground text-center">
                <p>Health checks run automatically every hour. Auto-refresh every 30 seconds.</p>
            </div>

            {/* Resync Confirmation Dialog */}
            <AlertDialog open={showResyncDialog} onOpenChange={setShowResyncDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Resync All Bots?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will restart ALL bots. All running bots will be stopped and reinitialized from the database.
                            This may cause temporary service interruption.
                            <br /><br />
                            <strong>Total bots: {stats?.totalBots || 0}</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResyncAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Resync All Bots
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
