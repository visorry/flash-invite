"use client"

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

export default function EditForwardRulePage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const params = useParams()
  const ruleId = params.id as string
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Scheduling
  const [scheduleMode, setScheduleMode] = useState(0)
  const [batchSize, setBatchSize] = useState(1)
  const [postInterval, setPostInterval] = useState(30)
  const [postIntervalUnit, setPostIntervalUnit] = useState(1)
  const [deleteAfterEnabled, setDeleteAfterEnabled] = useState(false)
  const [deleteInterval, setDeleteInterval] = useState(1)
  const [deleteIntervalUnit, setDeleteIntervalUnit] = useState(2)
  const [broadcastEnabled, setBroadcastEnabled] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastParseMode, setBroadcastParseMode] = useState('')
  const [broadcastDeleteAfter, setBroadcastDeleteAfter] = useState(false)
  const [broadcastDeleteInterval, setBroadcastDeleteInterval] = useState(1)
  const [broadcastDeleteUnit, setBroadcastDeleteUnit] = useState(2)
  const [startFromMessageId, setStartFromMessageId] = useState('')
  const [endAtMessageId, setEndAtMessageId] = useState('')
  const [shuffle, setShuffle] = useState(false)
  const [repeatWhenDone, setRepeatWhenDone] = useState(false)

  // Content filters
  const [forwardMedia, setForwardMedia] = useState(true)
  const [forwardText, setForwardText] = useState(true)
  const [forwardDocuments, setForwardDocuments] = useState(true)
  const [forwardStickers, setForwardStickers] = useState(false)
  const [forwardPolls, setForwardPolls] = useState(true)

  // Modifications
  const [removeLinks, setRemoveLinks] = useState(false)
  const [addWatermark, setAddWatermark] = useState('')

  // Keywords
  const [includeKeywords, setIncludeKeywords] = useState('')
  const [excludeKeywords, setExcludeKeywords] = useState('')
  const [hideAuthorSignature, setHideAuthorSignature] = useState(false)

  // Fetch rule
  const { data: rule, isLoading: ruleLoading } = useQuery({
    queryKey: ['forward-rule', ruleId],
    queryFn: () => api.forwardRules.getById(ruleId),
    enabled: !!ruleId,
  })

  // Populate form when rule loads
  useEffect(() => {
    if (rule) {
      const r = rule as any
      setName(r.name || '')
      setIsActive(r.isActive ?? true)
      setScheduleMode(r.scheduleMode ?? 0)
      setBatchSize(r.batchSize ?? 1)
      setPostInterval(r.postInterval ?? 30)
      setPostIntervalUnit(r.postIntervalUnit ?? 1)
      setDeleteAfterEnabled(r.deleteAfterEnabled ?? false)
      setDeleteInterval(r.deleteInterval ?? 1)
      setDeleteIntervalUnit(r.deleteIntervalUnit ?? 2)
      setBroadcastEnabled(r.broadcastEnabled ?? false)
      setBroadcastMessage(r.broadcastMessage || '')
      setBroadcastParseMode(r.broadcastParseMode || '')
      setBroadcastDeleteAfter(r.broadcastDeleteAfter ?? false)
      setBroadcastDeleteInterval(r.broadcastDeleteInterval ?? 1)
      setBroadcastDeleteUnit(r.broadcastDeleteUnit ?? 2)
      setStartFromMessageId(r.startFromMessageId?.toString() || '')
      setEndAtMessageId(r.endAtMessageId?.toString() || '')
      setShuffle(r.shuffle ?? false)
      setRepeatWhenDone(r.repeatWhenDone ?? false)
      setForwardMedia(r.forwardMedia ?? true)
      setForwardText(r.forwardText ?? true)
      setForwardDocuments(r.forwardDocuments ?? true)
      setForwardStickers(r.forwardStickers ?? false)
      setForwardPolls(r.forwardPolls ?? true)
      setRemoveLinks(r.removeLinks ?? false)
      setAddWatermark(r.addWatermark || '')
      setIncludeKeywords(r.includeKeywords?.join(', ') || '')
      setExcludeKeywords(r.excludeKeywords?.join(', ') || '')
      setHideAuthorSignature(r.hideAuthorSignature === true)
    }
  }, [rule])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: () => api.forwardRules.update(ruleId, {
      name,
      isActive,
      scheduleMode,
      batchSize,
      postInterval,
      postIntervalUnit,
      deleteAfterEnabled,
      deleteInterval: deleteAfterEnabled && deleteIntervalUnit !== 5 ? deleteInterval : null,
      deleteIntervalUnit: deleteAfterEnabled ? deleteIntervalUnit : null,
      broadcastEnabled,
      broadcastMessage: broadcastEnabled ? broadcastMessage : null,
      broadcastParseMode: broadcastEnabled && broadcastParseMode ? broadcastParseMode : null,
      broadcastDeleteAfter: broadcastEnabled ? broadcastDeleteAfter : null,
      broadcastDeleteInterval: broadcastEnabled && broadcastDeleteAfter && broadcastDeleteUnit !== 5 ? broadcastDeleteInterval : null,
      broadcastDeleteUnit: broadcastEnabled && broadcastDeleteAfter ? broadcastDeleteUnit : null,
      startFromMessageId: startFromMessageId ? parseInt(startFromMessageId) : null,
      endAtMessageId: endAtMessageId ? parseInt(endAtMessageId) : null,
      shuffle,
      repeatWhenDone,
      forwardMedia,
      forwardText,
      forwardDocuments,
      forwardStickers,
      forwardPolls,
      removeLinks,
      addWatermark: addWatermark || null,
      includeKeywords: includeKeywords ? includeKeywords.split(',').map(k => k.trim()) : [],
      excludeKeywords: excludeKeywords ? excludeKeywords.split(',').map(k => k.trim()) : [],
      hideAuthorSignature,
    }),
    onSuccess: (data) => {
      toast.success('Forward rule updated')
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['forward-rule', ruleId] })
      queryClient.invalidateQueries({ queryKey: ['forward-rules'] })
      router.push('/dashboard/forward-rules' as any)
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
          <h1 className="text-lg font-semibold">Edit Forward Rule</h1>
          <p className="text-xs text-muted-foreground">
            Update forwarding settings
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
              placeholder="e.g., News to Backup"
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
        </CardContent>
      </Card>

      {/* Source & Destination (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Source & Destination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="truncate">
              {ruleData.sourceEntity?.title || 'Unknown'}
            </span>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="truncate">
              {ruleData.destinationEntity?.title || 'Unknown'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Source and destination cannot be changed. Delete and create a new rule if needed.
          </p>
        </CardContent>
      </Card>

      {/* Scheduling Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Scheduling Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mode" className="text-xs">Mode</Label>
            <select
              id="mode"
              value={scheduleMode}
              onChange={(e) => setScheduleMode(parseInt(e.target.value))}
              className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value={0}>Realtime (forward new messages as they arrive)</option>
              <option value={1}>Scheduled (forward from message history)</option>
            </select>
          </div>

          {scheduleMode === 1 && (
            <>
              <div>
                <Label htmlFor="batchSize" className="text-xs">Batch Size</Label>
                <Input
                  id="batchSize"
                  type="number"
                  min={1}
                  max={100}
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of posts to forward in a single batch
                </p>
              </div>

              <div>
                <Label htmlFor="postInterval" className="text-xs">Post Interval</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="postInterval"
                    type="number"
                    min={1}
                    value={postInterval}
                    onChange={(e) => setPostInterval(parseInt(e.target.value) || 1)}
                    className="flex-1"
                  />
                  <select
                    value={postIntervalUnit}
                    onChange={(e) => setPostIntervalUnit(parseInt(e.target.value))}
                    className="w-32 h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value={0}>Seconds</option>
                    <option value={1}>Minutes</option>
                    <option value={2}>Hours</option>
                    <option value={3}>Days</option>
                    <option value={4}>Months</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Time between each batch of forwarded messages
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="deleteAfter" className="text-xs">Auto-Delete Messages</Label>
                  <Switch
                    id="deleteAfter"
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
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically delete forwarded messages after specified time
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Label htmlFor="broadcast" className="text-xs">Broadcast Message</Label>
                    <p className="text-xs text-muted-foreground">
                      Send message after each batch completes
                    </p>
                  </div>
                  <Switch
                    id="broadcast"
                    checked={broadcastEnabled}
                    onCheckedChange={setBroadcastEnabled}
                  />
                </div>
                {broadcastEnabled && (
                  <>
                    <Textarea
                      placeholder="Message to send after batch completion..."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="mt-2 h-20"
                    />
                    <select
                      value={broadcastParseMode}
                      onChange={(e) => setBroadcastParseMode(e.target.value)}
                      className="mt-2 w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Plain Text</option>
                      <option value="HTML">HTML</option>
                      <option value="Markdown">Markdown</option>
                    </select>

                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="broadcastDelete" className="text-xs">Auto-Delete Broadcast</Label>
                        <Switch
                          id="broadcastDelete"
                          checked={broadcastDeleteAfter}
                          onCheckedChange={setBroadcastDeleteAfter}
                        />
                      </div>
                      {broadcastDeleteAfter && (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min={1}
                            value={broadcastDeleteInterval}
                            onChange={(e) => setBroadcastDeleteInterval(parseInt(e.target.value) || 1)}
                            className="flex-1"
                            disabled={broadcastDeleteUnit === 5}
                          />
                          <select
                            value={broadcastDeleteUnit}
                            onChange={(e) => setBroadcastDeleteUnit(parseInt(e.target.value))}
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Automatically delete broadcast message after specified time
                      </p>
                    </div>
                  </>
                )}
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
              <p className="text-xs text-muted-foreground">
                To find message IDs: open the message in Telegram, copy its link (e.g., t.me/channel/123), the number at the end is the ID. Messages that don't exist will be skipped.
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="shuffle" className="text-xs">Shuffle</Label>
                  <p className="text-xs text-muted-foreground">
                    Randomize message order
                  </p>
                </div>
                <Switch
                  id="shuffle"
                  checked={shuffle}
                  onCheckedChange={setShuffle}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="repeat" className="text-xs">Repeat When Done</Label>
                  <p className="text-xs text-muted-foreground">
                    Start over after all messages
                  </p>
                </div>
                <Switch
                  id="repeat"
                  checked={repeatWhenDone}
                  onCheckedChange={setRepeatWhenDone}
                />
              </div>
            </>
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
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="hideAuthorSignature" className="text-xs">Hide Author Signature</Label>
              <p className="text-xs text-muted-foreground">
                Hide "Forwarded from" label (uses copy instead of forward)
              </p>
            </div>
            <Switch
              id="hideAuthorSignature"
              checked={hideAuthorSignature}
              onCheckedChange={setHideAuthorSignature}
            />
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
            <p className="text-xs text-muted-foreground mt-1">
              Only forward if message contains any of these
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              Don't forward if message contains any of these
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        className="w-full"
        onClick={() => updateMutation.mutate()}
        disabled={!name || updateMutation.isPending}
      >
        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  )
}
