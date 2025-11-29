"use client"

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

export default function EditAutoApprovalPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const params = useParams()
  const ruleId = params.id as string

  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Approval settings
  const [approvalMode, setApprovalMode] = useState(0)
  const [delayInterval, setDelayInterval] = useState(30)
  const [delayUnit, setDelayUnit] = useState(0)

  // Filters
  const [requirePremium, setRequirePremium] = useState(false)
  const [requireUsername, setRequireUsername] = useState(false)
  const [minAccountAge, setMinAccountAge] = useState('')

  // Welcome message
  const [sendWelcomeMsg, setSendWelcomeMsg] = useState(false)
  const [welcomeMessage, setWelcomeMessage] = useState('')

  // Fetch rule
  const { data: rule, isLoading: ruleLoading } = useQuery({
    queryKey: ['auto-approval-rule', ruleId],
    queryFn: () => api.autoApproval.getById(ruleId),
    enabled: !!ruleId,
  })

  // Populate form when rule loads
  useEffect(() => {
    if (rule) {
      const r = rule as any
      setName(r.name || '')
      setIsActive(r.isActive ?? true)
      setApprovalMode(r.approvalMode ?? 0)
      setDelayInterval(r.delayInterval ?? 30)
      setDelayUnit(r.delayUnit ?? 0)
      setRequirePremium(r.requirePremium ?? false)
      setRequireUsername(r.requireUsername ?? false)
      setMinAccountAge(r.minAccountAge?.toString() || '')
      setSendWelcomeMsg(r.sendWelcomeMsg ?? false)
      setWelcomeMessage(r.welcomeMessage || '')
    }
  }, [rule])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: () => api.autoApproval.update(ruleId, {
      name,
      isActive,
      approvalMode,
      delayInterval: approvalMode === 1 ? delayInterval : 0,
      delayUnit: approvalMode === 1 ? delayUnit : 0,
      requirePremium,
      requireUsername,
      minAccountAge: minAccountAge ? parseInt(minAccountAge) : null,
      sendWelcomeMsg,
      welcomeMessage: sendWelcomeMsg ? welcomeMessage : null,
    }),
    onSuccess: () => {
      toast.success('Auto-approval rule updated')
      router.push('/dashboard/auto-approval' as any)
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
          <h1 className="text-lg font-semibold">Edit Auto-Approval Rule</h1>
          <p className="text-xs text-muted-foreground">
            Update approval settings
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
              placeholder="e.g., VIP Group Auto-Approve"
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

          <div className="text-sm text-muted-foreground">
            <strong>Group:</strong> {ruleData.telegramEntity?.title || 'Unknown'}
            <br />
            <strong>Bot:</strong> @{ruleData.bot?.username || 'Unknown'}
          </div>
        </CardContent>
      </Card>

      {/* Approval Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Approval Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mode" className="text-xs">Mode</Label>
            <select
              id="mode"
              value={approvalMode}
              onChange={(e) => setApprovalMode(parseInt(e.target.value))}
              className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value={0}>Instant (approve immediately)</option>
              <option value={1}>Delayed (approve after delay)</option>
            </select>
          </div>

          {approvalMode === 1 && (
            <div>
              <Label htmlFor="delay" className="text-xs">Delay</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="delay"
                  type="number"
                  min={1}
                  value={delayInterval}
                  onChange={(e) => setDelayInterval(parseInt(e.target.value) || 1)}
                  className="flex-1"
                />
                <select
                  value={delayUnit}
                  onChange={(e) => setDelayUnit(parseInt(e.target.value))}
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
                Wait this long before approving
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="requireUsername" className="text-xs">Require Username</Label>
              <p className="text-xs text-muted-foreground">
                Only approve users with a username
              </p>
            </div>
            <Switch
              id="requireUsername"
              checked={requireUsername}
              onCheckedChange={setRequireUsername}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="requirePremium" className="text-xs">Require Premium</Label>
              <p className="text-xs text-muted-foreground">
                Only approve Telegram Premium users
              </p>
            </div>
            <Switch
              id="requirePremium"
              checked={requirePremium}
              onCheckedChange={setRequirePremium}
            />
          </div>

          <div>
            <Label htmlFor="minAge" className="text-xs">Minimum Account Age (days)</Label>
            <Input
              id="minAge"
              type="number"
              min={0}
              placeholder="e.g., 7"
              value={minAccountAge}
              onChange={(e) => setMinAccountAge(e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Welcome Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Welcome Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sendWelcome" className="text-xs">Send Welcome Message</Label>
              <p className="text-xs text-muted-foreground">
                Send a DM after approval
              </p>
            </div>
            <Switch
              id="sendWelcome"
              checked={sendWelcomeMsg}
              onCheckedChange={setSendWelcomeMsg}
            />
          </div>

          {sendWelcomeMsg && (
            <div>
              <Label htmlFor="welcomeMsg" className="text-xs">Message</Label>
              <Textarea
                id="welcomeMsg"
                placeholder="Welcome to the group! Please read the rules..."
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="mt-1 h-24"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Statistics</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-xs">Approved</p>
              <p className="font-medium">{ruleData.approvedCount || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Rejected</p>
              <p className="font-medium">{ruleData.rejectedCount || 0}</p>
            </div>
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
