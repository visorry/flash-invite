"use client"

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Crown, Globe, Clock, CheckSquare, Square } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface SubscriberSearchProps {
    botId: string
    selectedIds: string[]
    onSelectionChange: (ids: string[]) => void
    maxHeight?: string
}

export function SubscriberSearch({ botId, selectedIds, onSelectionChange, maxHeight = '400px' }: SubscriberSearchProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // Debounce search input
    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(searchTerm)
        }, 300)
        return () => clearTimeout(timeout)
    }, [searchTerm])

    // Fetch subscribers
    const { data: subscribers, isLoading } = useQuery({
        queryKey: ['subscribers-search', botId, debouncedSearch],
        queryFn: async () => {
            return api.broadcast.getSubscribers(botId, {
                search: debouncedSearch,
                size: 100,
            })
        },
        enabled: !!botId,
    })

    const subscriberList = (subscribers as any)?.items || []
    const allCurrentPageIds = subscriberList.map((s: any) => s.id)
    const allSelected = allCurrentPageIds.length > 0 && allCurrentPageIds.every((id: string) => selectedIds.includes(id))
    const someSelected = allCurrentPageIds.some((id: string) => selectedIds.includes(id)) && !allSelected

    const handleToggleAll = () => {
        if (allSelected) {
            // Deselect all from current page
            onSelectionChange(selectedIds.filter(id => !allCurrentPageIds.includes(id)))
        } else {
            // Select all from current page
            const newIds = [...new Set([...selectedIds, ...allCurrentPageIds])]
            onSelectionChange(newIds)
        }
    }

    const handleToggleSubscriber = (subscriberId: string) => {
        if (selectedIds.includes(subscriberId)) {
            onSelectionChange(selectedIds.filter(id => id !== subscriberId))
        } else {
            onSelectionChange([...selectedIds, subscriberId])
        }
    }

    return (
        <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by username or name..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Select/Deselect All */}
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleAll}
                    disabled={subscriberList.length === 0}
                    className="h-8"
                >
                    {allSelected ? (
                        <>
                            <CheckSquare className="h-3 w-3 mr-1" />
                            Deselect All
                        </>
                    ) : (
                        <>
                            <Square className="h-3 w-3 mr-1" />
                            Select All
                        </>
                    )}
                </Button>
                <Badge variant="secondary">
                    {selectedIds.length} selected
                </Badge>
            </div>

            {/* Subscriber List */}
            <div className="border rounded-md" style={{ maxHeight, overflowY: 'auto' }}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                ) : subscriberList.length > 0 ? (
                    <div className="divide-y">
                        {subscriberList.map((subscriber: any) => {
                            const isSelected = selectedIds.includes(subscriber.id)
                            return (
                                <div
                                    key={subscriber.id}
                                    className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => handleToggleSubscriber(subscriber.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => handleToggleSubscriber(subscriber.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                            {subscriber.firstName?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm truncate">
                                                    {subscriber.firstName || 'Unknown'} {subscriber.lastName || ''}
                                                </p>
                                                {subscriber.isPremium && (
                                                    <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" title="Telegram Premium" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {subscriber.username && <span>@{subscriber.username}</span>}
                                                {subscriber.languageCode && (
                                                    <span className="flex items-center gap-1">
                                                        <Globe className="h-3 w-3" />
                                                        {subscriber.languageCode}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {subscriber.lastActiveAt && (
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(subscriber.lastActiveAt).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">
                            {debouncedSearch ? 'No subscribers found matching your search' : 'No subscribers found'}
                        </p>
                    </div>
                )}
            </div>

            {/* Total Info */}
            {!isLoading && subscriberList.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    Showing {subscriberList.length} of {(subscribers as any)?.total || 0} subscribers
                </p>
            )}
        </div>
    )
}
