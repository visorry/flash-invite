"use client"

import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

export default function CreatePromoterPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [botId, setBotId] = useState('')
  const [vaultEntityId, setVaultEntityId] = useState('')
  const [marketingEntityId, setMarketingEntityId] = useState('')
  const [ctaTemplate, setCtaTemplate] = useState('🔥 Get exclusive content here: {link}')
  const [includeCaptionInCta, setIncludeCaptionInCta] = useState(true)
  const [tokenExpiryDays, setTokenExpiryDays] = useState(30)

  // Auto-delete marketing posts
  const [deleteMarketingAfterEnabled, setDeleteMarketingAfterEnabled] = useState(false)
  const [deleteMarketingInterval, setDeleteMarketingInterval] = useState(1)
  const [deleteMarketingIntervalUnit, setDeleteMarketingIntervalUnit] = useState(2) // hours

  // Auto-delete delivered content
  const [deleteDeliveredAfterEnabled, setDeleteDeliveredAfterEnabled] = useState(false)
  const [deleteDeliveredInterval, setDeleteDeliveredInterval] = useState(24)
  const [deleteDeliveredIntervalUnit, setDeleteDeliveredIntervalUnit] = useState(2) // hours

  // Delivery options
  const [hideSenderName, setHideSenderName] = useState(false)
  const [copyMode, setCopyMode] = useState(false)
  const [removeLinks, setRemoveLinks] = useState(false)
  const [addWatermark, setAddWatermark] = useState('')

  // Custom error messages
  const [invalidTokenMessage, setInvalidTokenMessage] = useState('')
  const [expiredTokenMessage, setExpiredTokenMessage] = useState('')
  const [vaultAccessErrorMessage, setVaultAccessErrorMessage] = useState('')
  const [marketingAccessErrorMessage, setMarketingAccessErrorMessage] = useState('')

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
    mutationFn: () => api.promoter.create({
      botId,
      vaultEntityId,
      marketingEntityId,
      name,
      ctaTemplate: ctaTemplate || undefined,
      includeCaptionInCta,
      tokenExpiryDays: tokenExpiryDays || undefined,
      deleteMarketingAfterEnabled,
      deleteMarketingInterval: deleteMarketingAfterEnabled && deleteMarketingIntervalUnit !== 5 ? deleteMarketingInterval : undefined,
      deleteMarketingIntervalUnit: deleteMarketingAfterEnabled ? deleteMarketingIntervalUnit : undefined,
      deleteDeliveredAfterEnabled,
      deleteDeliveredInterval: deleteDeliveredAfterEnabled && deleteDeliveredIntervalUnit !== 5 ? deleteDeliveredInterval : undefined,
      deleteDeliveredIntervalUnit: deleteDeliveredAfterEnabled ? deleteDeliveredIntervalUnit : undefined,
      hideSenderName,
      copyMode,
      removeLinks,
      addWatermark: addWatermark || undefined,
      invalidTokenMessage: invalidTokenMessage || undefined,
      expiredTokenMessage: expiredTokenMessage || undefined,
      vaultAccessErrorMessage: vaultAccessErrorMessage || undefined,
      marketingAccessErrorMessage: marketingAccessErrorMessage || undefined,
    }),
    onSuccess: async () => {
      toast.success('Promoter created')
      await queryClient.invalidateQueries({ queryKey: ['promoter-configs'] })
      router.push('/dashboard/promoter' as any)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create promoter')
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

  const canSubmit = name && botId && vaultEntityId && marketingEntityId

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
          <h1 className="text-lg font-semibold">Create Promoter</h1>
          <p className="text-xs text-muted-foreground">
            Set up content promotion via deep links
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
            <Label htmlFor="name" className="text-xs">Promoter Name</Label>
            <Input
              id="name"
              placeholder="e.g., Premium Content Promoter"
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
                setVaultEntityId('')
                setMarketingEntityId('')
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
            <p className="text-xs text-muted-foreground mt-1">
              Bot must be admin in both vault and marketing groups
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Groups */}
      {botId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Groups Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="vault" className="text-xs">Vault Group (Content Source)</Label>
              <select
                id="vault"
                value={vaultEntityId}
                onChange={(e) => setVaultEntityId(e.target.value)}
                className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select vault group</option>
                {entitiesList.map((link: any) => (
                  <option key={link.telegramEntity.id} value={link.telegramEntity.id}>
                    {link.telegramEntity.title}
                    {link.telegramEntity.username && ` (@${link.telegramEntity.username})`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Private group where you upload original content
              </p>
            </div>

            <div>
              <Label htmlFor="marketing" className="text-xs">Marketing Group (Promotion)</Label>
              <select
                id="marketing"
                value={marketingEntityId}
                onChange={(e) => setMarketingEntityId(e.target.value)}
                className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select marketing group</option>
                {entitiesList
                  .filter((link: any) => link.telegramEntity.id !== vaultEntityId)
                  .map((link: any) => (
                    <option key={link.telegramEntity.id} value={link.telegramEntity.id}>
                      {link.telegramEntity.title}
                      {link.telegramEntity.username && ` (@${link.telegramEntity.username})`}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Public group where promotional posts with deep links are sent
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Call-to-Action Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cta" className="text-xs">CTA Message Template</Label>
            <Textarea
              id="cta"
              placeholder="🔥 Get exclusive content here: {link}"
              value={ctaTemplate}
              onChange={(e) => setCtaTemplate(e.target.value)}
              className="mt-1 h-24"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use {'{link}'} placeholder for the deep link. This message will be posted in the marketing group.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="includeCaption" className="text-xs">Include Original Caption</Label>
              <p className="text-xs text-muted-foreground">
                Include the vault post caption in marketing post
              </p>
            </div>
            <Switch
              id="includeCaption"
              checked={includeCaptionInCta}
              onCheckedChange={setIncludeCaptionInCta}
            />
          </div>

          <div>
            <Label htmlFor="expiry" className="text-xs">Token Expiry (Days)</Label>
            <Input
              id="expiry"
              type="number"
              min={1}
              max={365}
              value={tokenExpiryDays}
              onChange={(e) => setTokenExpiryDays(parseInt(e.target.value) || 30)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              How long tokens remain valid (default: 30 days)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Delete Marketing Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Auto-Delete Marketing Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="deleteMarketing" className="text-xs">Enable Auto-Delete</Label>
              <p className="text-xs text-muted-foreground">
                Automatically delete marketing posts after specified time
              </p>
            </div>
            <Switch
              id="deleteMarketing"
              checked={deleteMarketingAfterEnabled}
              onCheckedChange={setDeleteMarketingAfterEnabled}
            />
          </div>

          {deleteMarketingAfterEnabled && (
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                value={deleteMarketingInterval}
                onChange={(e) => setDeleteMarketingInterval(parseInt(e.target.value) || 1)}
                className="flex-1"
                disabled={deleteMarketingIntervalUnit === 5}
              />
              <select
                value={deleteMarketingIntervalUnit}
                onChange={(e) => setDeleteMarketingIntervalUnit(parseInt(e.target.value))}
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

      {/* Auto-Delete Delivered Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Auto-Delete Delivered Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="deleteDelivered" className="text-xs">Enable Auto-Delete</Label>
              <p className="text-xs text-muted-foreground">
                Automatically delete content sent to users after specified time
              </p>
            </div>
            <Switch
              id="deleteDelivered"
              checked={deleteDeliveredAfterEnabled}
              onCheckedChange={setDeleteDeliveredAfterEnabled}
            />
          </div>

          {deleteDeliveredAfterEnabled && (
            <>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={deleteDeliveredInterval}
                  onChange={(e) => setDeleteDeliveredInterval(parseInt(e.target.value) || 1)}
                  className="flex-1"
                  disabled={deleteDeliveredIntervalUnit === 5}
                />
                <select
                  value={deleteDeliveredIntervalUnit}
                  onChange={(e) => setDeleteDeliveredIntervalUnit(parseInt(e.target.value))}
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
              <p className="text-xs text-yellow-600 dark:text-yellow-500">
                ⚠️ This will delete content from users' private chats. Use carefully!
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delivery Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Content Delivery Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="hideSender" className="text-xs">Hide Sender Name</Label>
              <p className="text-xs text-muted-foreground">
                Remove "Forwarded from" label
              </p>
            </div>
            <Switch
              id="hideSender"
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
                Strip URLs and @mentions from caption
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
              placeholder="Text to append to caption..."
              value={addWatermark}
              onChange={(e) => setAddWatermark(e.target.value)}
              className="mt-1 h-20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Custom Error Messages (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="invalidToken" className="text-xs">Invalid Token Message</Label>
            <Textarea
              id="invalidToken"
              placeholder="Leave empty for default message"
              value={invalidTokenMessage}
              onChange={(e) => setInvalidTokenMessage(e.target.value)}
              className="mt-1 h-16"
            />
          </div>

          <div>
            <Label htmlFor="expiredToken" className="text-xs">Expired Token Message</Label>
            <Textarea
              id="expiredToken"
              placeholder="Leave empty for default message"
              value={expiredTokenMessage}
              onChange={(e) => setExpiredTokenMessage(e.target.value)}
              className="mt-1 h-16"
            />
          </div>

          <div>
            <Label htmlFor="vaultError" className="text-xs">Vault Access Error Message</Label>
            <Textarea
              id="vaultError"
              placeholder="Leave empty for default message"
              value={vaultAccessErrorMessage}
              onChange={(e) => setVaultAccessErrorMessage(e.target.value)}
              className="mt-1 h-16"
            />
          </div>

          <div>
            <Label htmlFor="marketingError" className="text-xs">Marketing Access Error Message</Label>
            <Textarea
              id="marketingError"
              placeholder="Leave empty for default message"
              value={marketingAccessErrorMessage}
              onChange={(e) => setMarketingAccessErrorMessage(e.target.value)}
              className="mt-1 h-16"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        className="w-full"
        onClick={() => createMutation.mutate()}
        disabled={!canSubmit || createMutation.isPending}
      >
        {createMutation.isPending ? 'Creating...' : 'Create Promoter'}
      </Button>
    </div>
  )
}
