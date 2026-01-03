"use client"

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

export default function EditAutoDropPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const params = useParams()
  const ruleId = params.id as string
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [command, setCommand] = useState('/drop')

  // Custom messages (optional)
  const [startMessage, setStartMessage] = useState('')
  const [endMessage, setEndMessage] = useState('')

  // Rate limiting
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true)
  const [rateLimitCount, setRateLimitCount] = useState(5)
  const [rateLimitWindow, setRateLimitWindow] = useState(60)
  const [rateLimitWindowUnit, setRateLimitWindowUnit] = useState(0)
  const [rateLimitMessage, setRateLimitMessage] = useState('')

  // Drop configuration
  const [postsPerDrop, setPostsPerDrop] = useState(1)
  const [randomOrder, setRandomOrder] = useState(false)
  const [startFromMessageId, setStartFromMessageId] = useState('')
  const [endAtMessageId, setEndAtMessageId] = useState('')

  // Auto-delete configuration
  const [deleteAfterEnabled, setDeleteAfterEnabled] = useState(false)
  const [deleteInterval, setDeleteInterval] = useState(1)
  const [deleteIntervalUnit, setDeleteIntervalUnit] = useState(2)

  // Content filters
  const [forwardMedia, setForwardMedia] = useState(true)
  const [forwardText, setForwardText] = useState(true)
  const [forwardDocuments, setForwardDocuments] = useState(true)
  const [forwardStickers, setForwardStickers] = useState(false)
  const [forwardPolls, setForwardPolls] = useState(true)

  // Modifications
  const [removeLinks, setRemoveLinks] = useState(false)
  const [addWatermark, setAddWatermark] = useState('')
  const [deleteWatermark, setDeleteWatermark] = useState(true)
  const [hideSenderName, setHideSenderName] = useState(false)
  const [copyMode, setCopyMode] = useState(false)

  // Keywords
  const [includeKeywords, setIncludeKeywords] = useState('')
  const [excludeKeywords, setExcludeKeywords] = useState('')

  // Fetch rule
  const { data: rule, isLoading: ruleLoading } = useQuery({
    queryKey: ['auto-drop-rule', ruleId],
    queryFn: () => api.autoDrop.getById(ruleId),
    enabled: !!ruleId,
  })

  // Populate form when rule loads
  useEffect(() => {
    if (rule) {
      const r = rule as any
      setName(r.name || '')
      setIsActive(r.isActive ?? true)
      setCommand(r.command || '/drop')
      setStartMessage(r.startMessage || '')
      setEndMessage(r.endMessage || '')
      setRateLimitEnabled(r.rateLimitEnabled ?? true)
      setRateLimitCount(r.rateLimitCount ?? 5)
      setRateLimitWindow(r.rateLimitWindow ?? 60)
      setRateLimitWindowUnit(r.rateLimitWindowUnit ?? 0)
      setRateLimitMessage(r.rateLimitMessage || '')
      setPostsPerDrop(r.postsPerDrop ?? 1)
      setRandomOrder(r.randomOrder ?? false)
      setStartFromMessageId(r.startFromMessageId?.toString() || '')
      setEndAtMessageId(r.endAtMessageId?.toString() || '')
      setDeleteAfterEnabled(r.deleteAfterEnabled ?? false)
      setDeleteInterval(r.deleteInterval ?? 1)
      setDeleteIntervalUnit(r.deleteIntervalUnit ?? 2)
      setForwardMedia(r.forwardMedia ?? true)
      setForwardText(r.forwardText ?? true)
      setForwardDocuments(r.forwardDocuments ?? true)
      setForwardStickers(r.forwardStickers ?? false)
      setForwardPolls(r.forwardPolls ?? true)
      setRemoveLinks(r.removeLinks ?? false)
      setAddWatermark(r.addWatermark || '')
      setDeleteWatermark(r.deleteWatermark ?? true)
      setHideSenderName(r.hideSenderName ?? false)
      setCopyMode(r.copyMode ?? false)
      setIncludeKeywords(r.includeKeywords?.join(', ') || '')
      setExcludeKeywords(r.excludeKeywords?.join(', ') || '')
    }
  }, [rule])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: () => api.autoDrop.update(ruleId, {
      name,
      isActive,
      command,
      startMessage: startMessage || null,
      endMessage: endMessage || null,
      rateLimitEnabled,
      rateLimitCount,
      rateLimitWindow,
      rateLimitWindowUnit,
      rateLimitMessage: rateLimitMessage || null,
      postsPerDrop,
      randomOrder,
      startFromMessageId: startFromMessageId ? parseInt(startFromMessageId) : null,
      endAtMessageId: endAtMessageId ? parseInt(endAtMessageId) : null,
      deleteAfterEnabled,
      deleteInterval: deleteAfterEnabled && deleteIntervalUnit !== 5 ? deleteInterval : null,
      deleteIntervalUnit: deleteAfterEnabled ? deleteIntervalUnit : null,
      forwardMedia,
      forwardText,
      forwardDocuments,
      forwardStickers,
      forwardPolls,
      removeLinks,
      addWatermark: addWatermark || null,
      deleteWatermark,
      hideSenderName,
      copyMode,
      includeKeywords: includeKeywords ? includeKeywords.split(',').map(k => k.trim()) : [],
      excludeKeywords: excludeKeywords ? excludeKeywords.split(',').map(k => k.trim()) : [],
    }),
    onSuccess: () => {
      toast.success('Auto drop rule updated')
      queryClient.invalidateQueries({ queryKey: ['auto-drop-rule', ruleId] })
      queryClient.invalidateQueries({ queryKey: ['auto-drop-rules'] })
      router.push('/dashboard/auto-drop' as any)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update rule')
    },
  })

  if (isLoading || ruleLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !rule) {
    return null
  }

  const ruleData = rule as any

  return (
    <div className="flex-1 space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Edit Auto Drop Rule</h1>
          <p className="text-xs text-muted-foreground">
            Update auto drop settings
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-xs">Rule Name</Label>
            <Input
              id="name"
              placeholder="e.g., Daily Posts"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive" className="text-xs">Active</Label>
              <p className="text-xs text-muted-foreground">
                Enable or disable this rule
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div>
            <Label htmlFor="command" className="text-xs">Command</Label>
            <Input
              id="command"
              placeholder="/drop"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="mt-1 font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Command users will type to get posts
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Source (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Source Channel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            {ruleData.sourceEntity?.title || 'No source channel (messages only)'}
            {ruleData.sourceEntity?.username && ` (@${ruleData.sourceEntity.username})`}
          </div>
          <p className="text-xs text-muted-foreground">
            Source cannot be changed. Delete and create a new rule if needed.
          </p>
        </CardContent>
      </Card>

      {/* Custom Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Custom Messages (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="startMessage" className="text-xs">Start Message</Label>
            <Textarea
              id="startMessage"
              placeholder="Message to send before posts..."
              value={startMessage}
              onChange={(e) => setStartMessage(e.target.value)}
              className="mt-1 h-20"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Sent before forwarding posts from source channel
            </p>
          </div>
          <div>
            <Label htmlFor="endMessage" className="text-xs">End Message</Label>
            <Textarea
              id="endMessage"
              placeholder="Message to send after posts..."
              value={endMessage}
              onChange={(e) => setEndMessage(e.target.value)}
              className="mt-1 h-20"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Sent after all posts have been forwarded
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Rate Limiting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="rateLimitEnabled" className="text-xs">Enable Rate Limiting</Label>
              <p className="text-xs text-muted-foreground">
                Prevent users from spamming the command
              </p>
            </div>
            <Switch
              id="rateLimitEnabled"
              checked={rateLimitEnabled}
              onCheckedChange={setRateLimitEnabled}
            />
          </div>

          {rateLimitEnabled && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="rateLimitCount" className="text-xs">Max Requests</Label>
                  <Input
                    id="rateLimitCount"
                    type="number"
                    min={1}
                    max={100}
                    value={rateLimitCount}
                    onChange={(e) => setRateLimitCount(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="rateLimitWindow" className="text-xs">Time Window</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="rateLimitWindow"
                      type="number"
                      min={1}
                      max={86400}
                      value={rateLimitWindow}
                      onChange={(e) => setRateLimitWindow(parseInt(e.target.value) || 60)}
                      className="flex-1"
                    />
                    <select
                      value={rateLimitWindowUnit}
                      onChange={(e) => setRateLimitWindowUnit(parseInt(e.target.value))}
                      className="w-28 h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value={0}>Seconds</option>
                      <option value={1}>Minutes</option>
                      <option value={2}>Hours</option>
                      <option value={3}>Days</option>
                    </select>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Allow {rateLimitCount} requests per {rateLimitWindow} {['seconds', 'minutes', 'hours', 'days'][rateLimitWindowUnit]}
              </p>

              <div>
                <Label htmlFor="rateLimitMessage" className="text-xs">Rate Limit Message (optional)</Label>
                <Textarea
                  id="rateLimitMessage"
                  placeholder="Custom message when rate limited..."
                  value={rateLimitMessage}
                  onChange={(e) => setRateLimitMessage(e.target.value)}
                  className="mt-1 h-16"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Drop Configuration - only shown when source channel exists */}
      {ruleData.sourceEntity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Drop Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="postsPerDrop" className="text-xs">Posts Per Drop</Label>
              <Input
                id="postsPerDrop"
                type="number"
                min={1}
                max={10}
                value={postsPerDrop}
                onChange={(e) => setPostsPerDrop(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of posts to send when user triggers the command
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="randomOrder" className="text-xs">Random Order</Label>
                <p className="text-xs text-muted-foreground">
                  Send posts in random order instead of sequential
                </p>
              </div>
              <Switch
                id="randomOrder"
                checked={randomOrder}
                onCheckedChange={setRandomOrder}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startId" className="text-xs">Start from Message ID</Label>
                <Input
                  id="startId"
                  type="number"
                  placeholder="e.g., 1"
                  value={startFromMessageId}
                  onChange={(e) => setStartFromMessageId(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endId" className="text-xs">End at Message ID</Label>
                <Input
                  id="endId"
                  type="number"
                  placeholder="e.g., 100"
                  value={endAtMessageId}
                  onChange={(e) => setEndAtMessageId(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-Delete Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Auto-Delete Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="deleteAfterEnabled" className="text-xs">Enable Auto-Delete</Label>
              <p className="text-xs text-muted-foreground">
                Automatically delete sent messages after specified time
              </p>
            </div>
            <Switch
              id="deleteAfterEnabled"
              checked={deleteAfterEnabled}
              onCheckedChange={setDeleteAfterEnabled}
            />
          </div>

          {deleteAfterEnabled && (
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                value={deleteInterval}
                onChange={(e) => setDeleteInterval(parseInt(e.target.value) || 1)}
                className="flex-1"
                disabled={deleteIntervalUnit === 5}
              />
              <select
                value={deleteIntervalUnit}
                onChange={(e) => setDeleteIntervalUnit(parseInt(e.target.value))}
                className="w-32 h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value={0}>Seconds</option>
                <option value={1}>Minutes</option>
                <option value={2}>Hours</option>
                <option value={3}>Days</option>
                <option value={4}>Months</option>
                <option value={5}>Never</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Content Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="forwardText" className="text-xs">Text Messages</Label>
            <Switch
              id="forwardText"
              checked={forwardText}
              onCheckedChange={setForwardText}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="forwardMedia" className="text-xs">Photos & Videos</Label>
            <Switch
              id="forwardMedia"
              checked={forwardMedia}
              onCheckedChange={setForwardMedia}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="forwardDocuments" className="text-xs">Documents</Label>
            <Switch
              id="forwardDocuments"
              checked={forwardDocuments}
              onCheckedChange={setForwardDocuments}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="forwardPolls" className="text-xs">Polls</Label>
            <Switch
              id="forwardPolls"
              checked={forwardPolls}
              onCheckedChange={setForwardPolls}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="forwardStickers" className="text-xs">Stickers</Label>
            <Switch
              id="forwardStickers"
              checked={forwardStickers}
              onCheckedChange={setForwardStickers}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Modifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="hideSenderName" className="text-xs">Hide Sender Name</Label>
              <p className="text-xs text-muted-foreground">
                Removes "Forwarded from" label completely
              </p>
            </div>
            <Switch
              id="hideSenderName"
              checked={hideSenderName}
              onCheckedChange={setHideSenderName}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="copyMode" className="text-xs">Copy Mode</Label>
              <p className="text-xs text-muted-foreground">
                Copy message instead of forwarding
              </p>
            </div>
            <Switch
              id="copyMode"
              checked={copyMode}
              onCheckedChange={setCopyMode}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="removeLinks" className="text-xs">Remove Links</Label>
              <p className="text-xs text-muted-foreground">
                Strip URLs and @mentions
              </p>
            </div>
            <Switch
              id="removeLinks"
              checked={removeLinks}
              onCheckedChange={setRemoveLinks}
            />
          </div>
          <div>
            <Label htmlFor="watermark" className="text-xs">Add Watermark</Label>
            <Textarea
              id="watermark"
              placeholder="Text to append to messages..."
              value={addWatermark}
              onChange={(e) => setAddWatermark(e.target.value)}
              className="mt-1 h-20"
            />
            {addWatermark && (
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-xs font-medium">Delete with post</p>
                  <p className="text-xs text-muted-foreground">
                    Delete watermark when post is deleted
                  </p>
                </div>
                <Switch
                  checked={deleteWatermark}
                  onCheckedChange={setDeleteWatermark}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Keyword Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Keyword Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="include" className="text-xs">Include Keywords</Label>
            <Input
              id="include"
              placeholder="e.g., breaking, urgent (comma separated)"
              value={includeKeywords}
              onChange={(e) => setIncludeKeywords(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="exclude" className="text-xs">Exclude Keywords</Label>
            <Input
              id="exclude"
              placeholder="e.g., spam, ad (comma separated)"
              value={excludeKeywords}
              onChange={(e) => setExcludeKeywords(e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        className="w-full"
        onClick={() => updateMutation.mutate()}
        disabled={!name || !command || updateMutation.isPending}
      >
        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  )
}
