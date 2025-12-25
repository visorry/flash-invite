'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Bot, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function CreateAutoDropPage() {
  const router = useRouter()
  const [selectedBotId, setSelectedBotId] = useState<string>('')

  // Form state
  const [name, setName] = useState('')
  const [botId, setBotId] = useState('')
  const [telegramEntityId, setTelegramEntityId] = useState('')
  const [startPostId, setStartPostId] = useState('')
  const [endPostId, setEndPostId] = useState('')
  const [batchSize, setBatchSize] = useState(1)
  const [dropInterval, setDropInterval] = useState(1)
  const [dropUnit, setDropUnit] = useState(1) // minutes
  const [hideAuthorSignature, setHideAuthorSignature] = useState(false)

  const { data: bots, isLoading: botsLoading, error: botsError } = useQuery({
    queryKey: ['bots'],
    queryFn: () => api.bots.list(),
  })

  const { data: telegramEntities, isLoading: entitiesLoading, error: entitiesError } = useQuery({
    queryKey: ['bot-chats', selectedBotId],
    queryFn: () => api.bots.getChats(selectedBotId),
    enabled: !!selectedBotId,
  })

  const createMutation = useMutation({
    mutationFn: () => api.autoDrop.create({
      name,
      botId,
      telegramEntityId,
      startPostId: startPostId ? parseInt(startPostId) : undefined,
      endPostId: endPostId ? parseInt(endPostId) : undefined,
      batchSize,
      dropInterval,
      dropUnit,
      hideAuthorSignature,
    }),
    onSuccess: () => {
      toast.success('Auto drop rule created successfully')
      router.push('/dashboard/auto-drop')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create auto drop rule')
    },
  })

  const handleBotChange = (newBotId: string) => {
    setSelectedBotId(newBotId)
    setBotId(newBotId)
    setTelegramEntityId('') // Reset entity selection
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!botId) {
      toast.error('Bot is required')
      return
    }
    if (!telegramEntityId) {
      toast.error('Source group is required')
      return
    }
    if (startPostId && endPostId && parseInt(endPostId) < parseInt(startPostId)) {
      toast.error('End post ID must be greater than or equal to start post ID')
      return
    }

    createMutation.mutate()
  }

  const timeUnits = [
    { value: 0, label: 'Seconds' },
    { value: 1, label: 'Minutes' },
    { value: 2, label: 'Hours' },
    { value: 3, label: 'Days' },
  ]

  if (botsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (botsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/auto-drop">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Auto Drop Rule</h1>
            <p className="text-muted-foreground">Error loading bots</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">Failed to load bots: {botsError.message}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/auto-drop">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Auto Drop Rule</h1>
          <p className="text-muted-foreground">
            Set up on-demand post delivery from source groups to users. Users get posts instantly with /post command.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>📱 User Commands</CardTitle>
          <CardDescription>
            Commands your bot users can use to get posts on-demand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">/post</span>
                <span className="text-muted-foreground">Get next batch of posts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">/stop</span>
                <span className="text-muted-foreground">Show auto drop info</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">/help</span>
                <span className="text-muted-foreground">Show available commands</span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 How it works:</strong> Each time a user types /post, they instantly receive the next batch of posts from your configured source groups. No subscription needed - it's completely on-demand!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rule Configuration</CardTitle>
          <CardDescription>
            Configure how posts should be automatically sent from your source group to bot users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                placeholder="e.g., Daily News Drop"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                A descriptive name for this auto drop rule
              </p>
            </div>

            <div>
              <Label htmlFor="bot">Select Bot</Label>
              <select
                id="bot"
                value={botId}
                onChange={(e) => handleBotChange(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Choose a bot</option>
                {Array.isArray(bots) ? (
                  bots.length > 0 ? (
                    bots.map((bot: any) => (
                      <option key={bot.id} value={bot.id}>
                        @{bot.username}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No bots found - Add a bot first</option>
                  )
                ) : (
                  <option value="" disabled>
                    {bots ? 'Error loading bots' : 'Loading bots...'}
                  </option>
                )}
              </select>
              <p className="text-sm text-muted-foreground mt-1">
                The bot that will send posts to users
              </p>
            </div>

            <div>
              <Label htmlFor="entity">Source Group/Channel</Label>
              <select
                id="entity"
                value={telegramEntityId}
                onChange={(e) => setTelegramEntityId(e.target.value)}
                disabled={!selectedBotId}
                className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm disabled:opacity-50"
              >
                <option value="">
                  {selectedBotId ? "Choose source group" : "Select a bot first"}
                </option>
                {entitiesLoading ? (
                  <option value="" disabled>Loading groups...</option>
                ) : entitiesError ? (
                  <option value="" disabled>Error loading groups: {entitiesError.message}</option>
                ) : Array.isArray(telegramEntities) ? (
                  telegramEntities.length > 0 ? (
                    telegramEntities.map((entityLink: any) => (
                      <option key={entityLink.telegramEntity.id} value={entityLink.telegramEntity.id}>
                        {entityLink.telegramEntity.title}
                        {entityLink.telegramEntity.username && ` (@${entityLink.telegramEntity.username})`}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No groups found - Sync bot chats first</option>
                  )
                ) : (
                  <option value="" disabled>No groups available</option>
                )}
              </select>
              <p className="text-sm text-muted-foreground mt-1">
                The group or channel to forward posts from. If no groups appear, make sure your bot is added to groups and sync the bot chats.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startPostId">Start Post ID (Optional)</Label>
                <Input
                  id="startPostId"
                  type="number"
                  placeholder="e.g., 100"
                  value={startPostId}
                  onChange={(e) => setStartPostId(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Message ID to start from (leave empty to start from latest)
                </p>
              </div>

              <div>
                <Label htmlFor="endPostId">End Post ID (Optional)</Label>
                <Input
                  id="endPostId"
                  type="number"
                  placeholder="e.g., 200"
                  value={endPostId}
                  onChange={(e) => setEndPostId(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Message ID to stop at (leave empty for continuous)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="batchSize">Batch Size</Label>
              <Input
                id="batchSize"
                type="number"
                min="1"
                max="10"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Number of posts to send in each batch (1-10)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dropInterval">Drop Interval</Label>
                <Input
                  id="dropInterval"
                  type="number"
                  min="1"
                  value={dropInterval}
                  onChange={(e) => setDropInterval(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Time between batches
                </p>
              </div>

              <div>
                <Label htmlFor="dropUnit">Time Unit</Label>
                <select
                  id="dropUnit"
                  value={dropUnit}
                  onChange={(e) => setDropUnit(parseInt(e.target.value))}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {timeUnits.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-muted-foreground mt-1">
                  Unit for the drop interval
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="hideAuthorSignature" className="text-base">
                  Hide Author Signature
                </Label>
                <p className="text-sm text-muted-foreground">
                  Hide "Forwarded from" label (uses copy instead of forward)
                </p>
              </div>
              <Switch
                id="hideAuthorSignature"
                checked={hideAuthorSignature}
                onCheckedChange={setHideAuthorSignature}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Rule'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/auto-drop">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}