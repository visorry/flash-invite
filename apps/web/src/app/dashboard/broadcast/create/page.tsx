"use client"

import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Send, Eye, Wand2, Users, Crown, Clock, Radio, Link2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect, Suspense } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function CreateBroadcastContent() {
    const { user, isLoading } = useSession()
    const router = useRouter()
    const queryClient = useQueryClient()
    const searchParams = useSearchParams()
    const initialBotId = searchParams.get('botId')

    const [formData, setFormData] = useState({
        botId: initialBotId || '',
        name: '',
        content: '',
        parseMode: 'HTML',
        sourceGroupId: 'none',
        watermarkEnabled: false,
        watermarkText: '',
        watermarkPosition: 'bottom',
        copyMode: true,
        removeLinks: false,
        filterCriteria: {
            isPremium: false,
            activeWithinDays: 0,
        },
    })

    const [previewData, setPreviewData] = useState<any>(null)

    // Fetch bots
    const { data: bots, isLoading: botsLoading } = useQuery({
        queryKey: ['broadcast-bots'],
        queryFn: async () => {
            return api.broadcast.listBotsWithSubscribers()
        },
    })

    // Fetch source groups for selected bot
    const { data: sourceGroups, isLoading: groupsLoading } = useQuery({
        queryKey: ['source-groups', formData.botId],
        queryFn: async () => {
            return api.broadcast.getSourceGroups(formData.botId)
        },
        enabled: !!formData.botId,
    })

    // Preview mutation
    const previewMutation = useMutation({
        mutationFn: (data: any) => api.broadcast.preview(data),
        onSuccess: (data: any) => {
            setPreviewData(data)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to preview broadcast')
        },
    })

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: any) => api.broadcast.create(data),
        onSuccess: (data: any) => {
            toast.success('Broadcast created successfully')
            router.push(`/dashboard/broadcast/${(data as any).id}/send` as any)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create broadcast')
        },
    })

    // Auto-preview on form changes
    useEffect(() => {
        if (formData.botId && formData.content) {
            const timeout = setTimeout(() => {
                previewMutation.mutate({
                    botId: formData.botId,
                    content: formData.content,
                    parseMode: formData.parseMode,
                    watermarkEnabled: formData.watermarkEnabled,
                    watermarkText: formData.watermarkText,
                    watermarkPosition: formData.watermarkPosition,
                    removeLinks: formData.removeLinks,
                    filterCriteria: formData.filterCriteria.activeWithinDays > 0 || formData.filterCriteria.isPremium
                        ? formData.filterCriteria
                        : undefined,
                })
            }, 500)
            return () => clearTimeout(timeout)
        }
    }, [formData.botId, formData.content, formData.watermarkEnabled, formData.watermarkText, formData.watermarkPosition, formData.removeLinks, formData.filterCriteria])

    const handleSubmit = () => {
        if (!formData.botId) {
            toast.error('Please select a bot')
            return
        }
        if (!formData.content && formData.sourceGroupId === 'none') {
            toast.error('Please enter message content or select a source group')
            return
        }

        createMutation.mutate({
            ...formData,
            sourceGroupId: formData.sourceGroupId === 'none' ? undefined : formData.sourceGroupId,
            parseMode: formData.parseMode === 'plain' ? '' : formData.parseMode,
            filterCriteria: formData.filterCriteria.activeWithinDays > 0 || formData.filterCriteria.isPremium
                ? formData.filterCriteria
                : undefined,
        })
    }

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
    const groupsList = (sourceGroups as any) || []

    return (
        <div className="flex-1 space-y-6 p-4 max-w-2xl mx-auto">
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
                        <Radio className="h-5 w-5" />
                        Create Broadcast
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Send a message to your subscribers
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
                {/* Bot Selection */}
                <div className="space-y-2">
                    <Label>Select Bot</Label>
                    <Select
                        value={formData.botId}
                        onValueChange={(value) => setFormData({ ...formData, botId: value, sourceGroupId: 'none' })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Choose a bot" />
                        </SelectTrigger>
                        <SelectContent>
                            {botsList.map((bot: any) => (
                                <SelectItem key={bot.id} value={bot.id}>
                                    @{bot.username} ({bot.subscriberCount} subscribers)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Broadcast Name */}
                <div className="space-y-2">
                    <Label>Broadcast Name (Optional)</Label>
                    <Input
                        placeholder="My Campaign..."
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                {/* Message Content */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Message Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Message Text</Label>
                            <Textarea
                                placeholder="Enter your broadcast message..."
                                className="min-h-[120px]"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Supports HTML: &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;italic&lt;/i&gt;, &lt;a href=&quot;...&quot;&gt;link&lt;/a&gt;
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Parse Mode</Label>
                            <Select
                                value={formData.parseMode}
                                onValueChange={(value) => setFormData({ ...formData, parseMode: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="HTML">HTML</SelectItem>
                                    <SelectItem value="Markdown">Markdown</SelectItem>
                                    <SelectItem value="plain">Plain Text</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Source Group */}
                {formData.botId && groupsList.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Link2 className="h-4 w-4" />
                                Forward from Source Group (Optional)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Source Group</Label>
                                <Select
                                    value={formData.sourceGroupId}
                                    onValueChange={(value) => setFormData({ ...formData, sourceGroupId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a group to forward from" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {groupsList.map((group: any) => (
                                            <SelectItem key={group.id} value={group.id}>
                                                {group.title} {group.username && `(@${group.username})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Forward posts from this group to all subscribers
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Watermark */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Wand2 className="h-4 w-4" />
                            Watermark
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Enable Watermark</Label>
                                <p className="text-xs text-muted-foreground">Add a text watermark to messages</p>
                            </div>
                            <Switch
                                checked={formData.watermarkEnabled}
                                onCheckedChange={(checked) => setFormData({ ...formData, watermarkEnabled: checked })}
                            />
                        </div>

                        {formData.watermarkEnabled && (
                            <>
                                <div className="space-y-2">
                                    <Label>Watermark Text</Label>
                                    <Input
                                        placeholder="@YourChannel"
                                        value={formData.watermarkText}
                                        onChange={(e) => setFormData({ ...formData, watermarkText: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Position</Label>
                                    <Select
                                        value={formData.watermarkPosition}
                                        onValueChange={(value) => setFormData({ ...formData, watermarkPosition: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="top">Top</SelectItem>
                                            <SelectItem value="bottom">Bottom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Target Audience
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="flex items-center gap-1">
                                    <Crown className="h-3 w-3 text-yellow-500" />
                                    Premium Users Only
                                </Label>
                                <p className="text-xs text-muted-foreground">Only send to Telegram Premium users</p>
                            </div>
                            <Switch
                                checked={formData.filterCriteria.isPremium}
                                onCheckedChange={(checked) => setFormData({
                                    ...formData,
                                    filterCriteria: { ...formData.filterCriteria, isPremium: checked },
                                })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Active Within (Days)
                            </Label>
                            <Select
                                value={formData.filterCriteria.activeWithinDays.toString()}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    filterCriteria: { ...formData.filterCriteria, activeWithinDays: parseInt(value) },
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">All subscribers</SelectItem>
                                    <SelectItem value="1">Active today</SelectItem>
                                    <SelectItem value="7">Active this week</SelectItem>
                                    <SelectItem value="30">Active this month</SelectItem>
                                    <SelectItem value="90">Active in 3 months</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Remove Links</Label>
                                <p className="text-xs text-muted-foreground">Strip URLs from message content</p>
                            </div>
                            <Switch
                                checked={formData.removeLinks}
                                onCheckedChange={(checked) => setFormData({ ...formData, removeLinks: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Preview */}
                {previewData && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Preview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                    <Users className="h-3 w-3 mr-1" />
                                    {previewData.recipientCount} recipients
                                </Badge>
                            </div>

                            {previewData.previewContent && (
                                <div className="bg-muted p-3 rounded-lg">
                                    <pre className="text-sm whitespace-pre-wrap font-sans">
                                        {previewData.previewContent}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push('/dashboard/broadcast' as any)}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={handleSubmit}
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? (
                            <>Creating...</>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Create Broadcast
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function CreateBroadcastPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        }>
            <CreateBroadcastContent />
        </Suspense>
    )
}
