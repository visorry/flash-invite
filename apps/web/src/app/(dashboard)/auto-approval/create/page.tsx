"use client"

import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

export default function CreateAutoApprovalPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()

  const [name, setName] = useState('')
  const [botId, setBotId] = useState('')
  const [telegramEntityId, setTelegramEntityId] = useState('')

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

  // Fetch bots
  const { data: bots } = useQuery({
    queryKey: ['bots'],
    queryFn: () => api.bots.list(),
  })

  // Fetch entities for selected bot
  const { data: entities } = useQuery({
    queryKey: ['bot-chats', botId],
    queryFn: () => api.bots.getChats(botId),
    enabled: !!botId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: () => api.autoApproval.create({
      botId,
      telegramEntityId,
      name,
      approvalMode,
      delayInterval: approvalMode === 1 ? delayInterval : 0,
      delayUnit: approvalMode === 1 ? delayUnit : 0,
      requirePremium,
      requireUsername,
      minAccountAge: minAccountAge ? parseInt(minAccountAge) : undefined,
      sendWelcomeMsg,
      welcomeMessage: sendWelcomeMsg ? welcomeMessage : undefined,
    }),
    onSuccess: () => {
      toast.success('Auto-approval rule created')
      router.push('/auto-approval' as any)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create rule')
    },
  })

  if (isLoading) {
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
  const entitiesList = (entities as any) || []

  const canSubmit = name && botId && telegramEntityId

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
          <h1 className="text-lg font-semibold">Create Auto-Approval Rule</h1>
          <p className="text-xs text-muted-foreground">
            Set up automatic join request handling
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

          <div>
            <Label htmlFor="bot" className="text-xs">Bot</Label>
            <select
              id="bot"
              value={botId}
              onChange={(e) => {
                setBotId(e.target.value)
                setTelegramEntityId('')
              }}
              className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Select a bot</option>
              {botsList.map((bot: any) => (
                <option key={bot.id} value={bot.id}>
                  @{bot.username}
                </option>
              ))}
            </select>
          </div>

          {botId && (
            <div>
              <Label htmlFor="entity" className="text-xs">Group/Channel</Label>
              <select
                id="entity"
                value={telegramEntityId}
                onChange={(e) => setTelegramEntityId(e.target.value)}
                className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select a group or channel</option>
                {entitiesList
                  .filter((link: any) => link.isAdmin)
                  .map((link: any) => (
                    <option key={link.telegramEntity.id} value={link.telegramEntity.id}>
                      {link.telegramEntity.title}
                      {link.telegramEntity.username && ` (@${link.telegramEntity.username})`}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Only showing chats where bot is admin
              </p>
            </div>
          )}
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
                Wait this long before approving (helps filter spam bots)
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
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to allow any account age
            </p>
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

      {/* Submit */}
      <Button
        className="w-full"
        onClick={() => createMutation.mutate()}
        disabled={!canSubmit || createMutation.isPending}
      >
        {createMutation.isPending ? 'Creating...' : 'Create Auto-Approval Rule'}
      </Button>
    </div>
  )
}
