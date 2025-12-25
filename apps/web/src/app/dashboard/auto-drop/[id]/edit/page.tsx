'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface EditAutoDropPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditAutoDropPage({ params }: EditAutoDropPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const queryClient = useQueryClient()

  // Form state
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [startPostId, setStartPostId] = useState('')
  const [endPostId, setEndPostId] = useState('')
  const [batchSize, setBatchSize] = useState(1)
  const [dropInterval, setDropInterval] = useState(1)
  const [dropUnit, setDropUnit] = useState(1)
  const [hideAuthorSignature, setHideAuthorSignature] = useState(false)

  const { data: rule, isLoading: ruleLoading } = useQuery({
    queryKey: ['auto-drop-rule', id],
    queryFn: () => api.autoDrop.getById(id),
  })

  const updateMutation = useMutation({
    mutationFn: () => api.autoDrop.update(id, {
      name,
      isActive,
      startPostId: startPostId ? parseInt(startPostId) : null,
      endPostId: endPostId ? parseInt(endPostId) : null,
      batchSize,
      dropInterval,
      dropUnit,
      hideAuthorSignature,
    }),
    onSuccess: () => {
      // Invalidate and refetch the rule data
      queryClient.invalidateQueries({ queryKey: ['auto-drop-rule', id] })
      toast.success('Auto drop rule updated successfully')
      router.push('/dashboard/auto-drop')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update auto drop rule')
    },
  })

  // Update form when rule data is loaded
  useEffect(() => {
    if (rule) {
      console.log('Loading rule data:', {
        hideAuthorSignature: rule.hideAuthorSignature,
        typeof: typeof rule.hideAuthorSignature,
        value: rule.hideAuthorSignature === true
      })

      setName(rule.name)
      setIsActive(rule.isActive)
      setStartPostId(rule.startPostId?.toString() || '')
      setEndPostId(rule.endPostId?.toString() || '')
      setBatchSize(rule.batchSize)
      setDropInterval(rule.dropInterval)
      setDropUnit(rule.dropUnit)
      // Explicitly handle null/undefined as false
      setHideAuthorSignature(rule.hideAuthorSignature === true)
    }
  }, [rule])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if (startPostId && endPostId && parseInt(endPostId) < parseInt(startPostId)) {
      toast.error('End post ID must be greater than or equal to start post ID')
      return
    }

    updateMutation.mutate()
  }

  const timeUnits = [
    { value: 0, label: 'Seconds' },
    { value: 1, label: 'Minutes' },
    { value: 2, label: 'Hours' },
    { value: 3, label: 'Days' },
  ]

  if (ruleLoading) {
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

  if (!rule) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/auto-drop">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rule Not Found</h1>
            <p className="text-muted-foreground">
              The auto drop rule you're looking for doesn't exist.
            </p>
          </div>
        </div>
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Auto Drop Rule</h1>
          <p className="text-muted-foreground">
            Update your auto drop rule configuration
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rule Configuration</CardTitle>
          <CardDescription>
            Bot: @{rule.bot.username} → Source: {rule.telegramEntity.title}
            {rule.telegramEntity.username && ` (@${rule.telegramEntity.username})`}
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

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable this auto drop rule
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
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

            {rule.status !== 'stopped' && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This rule is currently {rule.status}.
                  Changes will take effect on the next scheduled run.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Rule'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/auto-drop">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rule Statistics</CardTitle>
          <CardDescription>
            Current status and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{rule.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current Position</p>
              <p className="font-medium">{rule.currentPostId || 'Not started'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dropped Count</p>
              <p className="font-medium">{rule.droppedCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Dropped</p>
              <p className="font-medium">
                {rule.lastDroppedAt
                  ? new Date(rule.lastDroppedAt).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}