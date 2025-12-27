"use client"

import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, Crown, Globe, Clock, Search, Filter } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function SubscribersPage() {
    const { user, isLoading } = useSession()
    const router = useRouter()
    const params = useParams()
    const botId = params.botId as string

    const [filters, setFilters] = useState({
        search: '',
        isSubscribed: undefined as boolean | undefined,
        isPremium: undefined as boolean | undefined,
        activeWithinDays: undefined as number | undefined,
    })

    // Fetch subscriber stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['subscriber-stats', botId],
        queryFn: async () => {
            return api.broadcast.getSubscriberStats(botId)
        },
        enabled: !!botId,
    })

    // Fetch subscribers
    const { data: subscribers, isLoading: subscribersLoading } = useQuery({
        queryKey: ['subscribers', botId, filters],
        queryFn: async () => {
            return api.broadcast.getSubscribers(botId, {
                ...filters,
                size: 50,
            })
        },
        enabled: !!botId,
    })

    if (isLoading || statsLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    const subscriberStats = (stats as any) || {}
    const subscriberList = (subscribers as any)?.items || []

    return (
        <div className="flex-1 space-y-6 p-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push('/dashboard/broadcast' as any)}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Subscribers
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Users who have started your bot
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Users className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">{subscriberStats.total || 0}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Users className="h-4 w-4 text-green-500" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">{subscriberStats.subscribed || 0}</p>
                                <p className="text-xs text-muted-foreground">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Crown className="h-4 w-4 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">{subscriberStats.premium || 0}</p>
                                <p className="text-xs text-muted-foreground">Premium</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                <Users className="h-4 w-4 text-red-500" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">{subscriberStats.blocked || 0}</p>
                                <p className="text-xs text-muted-foreground">Blocked</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Activity Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Active today</span>
                        <span className="font-medium">{subscriberStats.activeToday || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Active this week</span>
                        <span className="font-medium">{subscriberStats.activeWeek || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Active this month</span>
                        <span className="font-medium">{subscriberStats.activeMonth || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">New today</span>
                        <span className="font-medium text-green-500">+{subscriberStats.newToday || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">New this week</span>
                        <span className="font-medium text-green-500">+{subscriberStats.newWeek || 0}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Language Stats */}
            {subscriberStats.languageStats?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Languages
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {subscriberStats.languageStats.map((lang: any) => (
                                <Badge key={lang.language} variant="secondary">
                                    {lang.language}: {lang.count}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by username..."
                        className="pl-9"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
                <Select
                    value={filters.isSubscribed === undefined ? 'all' : filters.isSubscribed ? 'active' : 'inactive'}
                    onValueChange={(value) => setFilters({
                        ...filters,
                        isSubscribed: value === 'all' ? undefined : value === 'active',
                    })}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Blocked</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={filters.isPremium === undefined ? 'all' : filters.isPremium ? 'premium' : 'regular'}
                    onValueChange={(value) => setFilters({
                        ...filters,
                        isPremium: value === 'all' ? undefined : value === 'premium',
                    })}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="regular">Regular</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Subscribers List */}
            <div className="space-y-2">
                <h2 className="text-sm font-medium">
                    Subscribers ({(subscribers as any)?.total || 0})
                </h2>
                {subscribersLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                ) : subscriberList.length > 0 ? (
                    <div className="space-y-2">
                        {subscriberList.map((subscriber: any) => (
                            <Card key={subscriber.id}>
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                            {subscriber.firstName?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm truncate">
                                                    {subscriber.firstName || 'Unknown'} {subscriber.lastName || ''}
                                                </p>
                                                {subscriber.isPremium && (
                                                    <span title="Telegram Premium">
                                                        <Crown className="h-3 w-3 text-yellow-500" />
                                                    </span>
                                                )}
                                                {subscriber.isBlocked && (
                                                    <Badge variant="destructive" className="text-xs">Blocked</Badge>
                                                )}
                                                {!subscriber.isSubscribed && !subscriber.isBlocked && (
                                                    <Badge variant="secondary" className="text-xs">Unsubscribed</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {subscriber.username && <span>@{subscriber.username}</span>}
                                                <span>ID: {subscriber.telegramUserId}</span>
                                                {subscriber.languageCode && (
                                                    <span className="flex items-center gap-1">
                                                        <Globe className="h-3 w-3" />
                                                        {subscriber.languageCode}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(subscriber.lastActiveAt).toLocaleDateString()}
                                            </div>
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
                                <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                                <p className="text-sm text-muted-foreground">No subscribers found</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
