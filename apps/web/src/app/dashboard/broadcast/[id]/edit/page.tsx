"use client"

import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Send, Eye, Wand2, Users, Crown, Clock, Radio, Save } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function EditBroadcastPage() {
    const { user, isLoading } = useSession()
    const router = useRouter()
    const params = useParams()
    const broadcastId = params.id as string
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState({
        name: '',
        content: '',
        parseMode: 'HTML',
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

    // Fetch broadcast
    const { data: broadcast, isLoading: broadcastLoading } = useQuery({
        queryKey: ['broadcast', broadcastId],
        queryFn: () => api.broadcast.getById(broadcastId),
        enabled: !!broadcastId,
    })

    // Populate form when broadcast loads
    useEffect(() => {
        if (broadcast) {
            const b = broadcast as any
            setFormData({
                name: b.name || '',
                content: b.content || '',
                parseMode: b.parseMode || 'HTML',
                watermarkEnabled: b.watermarkEnabled || false,
                watermarkText: b.watermarkText || '',
                watermarkPosition: b.watermarkPosition || 'bottom',
                copyMode: b.copyMode ?? true,
                removeLinks: b.removeLinks || false,
                filterCriteria: {
                    isPremium: b.filterCriteria?.isPremium || false,
                    activeWithinDays: b.filterCriteria?.activeWithinDays || 0,
                },
            })
        }
    }, [broadcast])

    // Preview mutation
    const previewMutation = useMutation({
        mutationFn: (data: any) => api.broadcast.preview(data),
        onSuccess: (data: any) => {
            setPreviewData(data)
        },
        onError: (error: any) => {
            // Silently fail preview
        },
    })

    // Update mutation - creates a new broadcast with updated content
    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            // Create a new broadcast with updated content (duplicate and update approach)
            const b = broadcast as any
            return api.broadcast.create({
                botId: b.botId,
                name: data.name,
                content: data.content,
                parseMode: data.parseMode === 'plain' ? '' : data.parseMode,
                watermarkEnabled: data.watermarkEnabled,
                watermarkText: data.watermarkText,
                watermarkPosition: data.watermarkPosition,
                copyMode: data.copyMode,
                removeLinks: data.removeLinks,
                filterCriteria: data.filterCriteria.activeWithinDays > 0 || data.filterCriteria.isPremium
                    ? data.filterCriteria
                    : undefined,
            })
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
            toast.success('Broadcast updated! Redirecting to send...')
            router.push(`/dashboard/broadcast/${(data as any).id}/send` as any)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update broadcast')
        },
    })

    // Auto-preview on form changes
    useEffect(() => {
        if (broadcast && formData.content) {
            const b = broadcast as any
            const timeout = setTimeout(() => {
                previewMutation.mutate({
                    botId: b.botId,
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
    }, [broadcast, formData.content, formData.watermarkEnabled, formData.watermarkText, formData.watermarkPosition, formData.removeLinks, formData.filterCriteria])

    const handleSubmit = () => {
        if (!formData.content) {
            toast.error('Please enter message content')
            return
        }

        updateMutation.mutate(formData)
    }

    if (isLoading || broadcastLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user || !broadcast) {
        return null
    }

    const broadcastData = broadcast as any

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
                        Edit Broadcast
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Modify and resend broadcast
                    </p>
                </div>
            </div>

            {/* Bot Info (read-only) */}
            <Card>
                <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">
                        <strong>Bot:</strong> @{broadcastData.bot?.username || 'Unknown'}
                    </div>
                </CardContent>
            </Card>

            {/* Form */}
            <div className="space-y-6">
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
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save & Send
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
