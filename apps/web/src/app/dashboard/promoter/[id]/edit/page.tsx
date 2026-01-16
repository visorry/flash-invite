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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

export default function EditPromoterPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const id = params.id as string

  const [name, setName] = useState('')
  const [ctaTemplate, setCtaTemplate] = useState('')
  const [includeCaptionInCta, setIncludeCaptionInCta] = useState(true)
  const [tokenExpiryDays, setTokenExpiryDays] = useState(30)

  // Auto-delete marketing posts
  const [deleteMarketingAfterEnabled, setDeleteMarketingAfterEnabled] = useState(false)
  const [deleteMarketingInterval, setDeleteMarketingInterval] = useState(1)
  const [deleteMarketingIntervalUnit, setDeleteMarketingIntervalUnit] = useState(2)

  // Auto-delete delivered content
  const [deleteDeliveredAfterEnabled, setDeleteDeliveredAfterEnabled] = useState(false)
  const [deleteDeliveredInterval, setDeleteDeliveredInterval] = useState(24)
  const [deleteDeliveredIntervalUnit, setDeleteDeliveredIntervalUnit] = useState(2)

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

  // Fetch config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['promoter-config', id],
    queryFn: () => api.promoter.getById(id),
    enabled: !!id,
  })

  // Populate form when config loads
  useEffect(() => {
    if (config) {
      const c = config as any
      setName(c.name || '')
      setCtaTemplate(c.ctaTemplate || '')
      setIncludeCaptionInCta(c.includeCaptionInCta ?? true)
      setTokenExpiryDays(c.tokenExpiryDays || 30)
      setDeleteMarketingAfterEnabled(c.deleteMarketingAfterEnabled || false)
      setDeleteMarketingInterval(c.deleteMarketingInterval || 1)
      setDeleteMarketingIntervalUnit(c.deleteMarketingIntervalUnit ?? 2)
      setDeleteDeliveredAfterEnabled(c.deleteDeliveredAfterEnabled || false)
      setDeleteDeliveredInterval(c.deleteDeliveredInterval || 24)
      setDeleteDeliveredIntervalUnit(c.deleteDeliveredIntervalUnit ?? 2)
      setHideSenderName(c.hideSenderName || false)
      setCopyMode(c.copyMode || false)
      setRemoveLinks(c.removeLinks || false)
      setAddWatermark(c.addWatermark || '')
      setInvalidTokenMessage(c.invalidTokenMessage || '')
      setExpiredTokenMessage(c.expiredTokenMessage || '')
      setVaultAccessErrorMessage(c.vaultAccessErrorMessage || '')
      setMarketingAccessErrorMessage(c.marketingAccessErrorMessage || '')
    }
  }, [config])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: () => api.promoter.update(id, {
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
      toast.success('Promoter updated')
      await queryClient.invalidateQueries({ queryKey: ['promoter-configs'] })
      await queryClient.invalidateQueries({ queryKey: ['promoter-config', id] })
      router.push('/dashboard/promoter' as any)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update promoter')
    },
  })

  if (isLoading || configLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !config) {
    return null
  }

  const c = config as any
  const canSubmit = name

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
          <h1 className="text-lg font-semibold">Edit Promoter</h1>
          <p className="text-xs text-muted-foreground">
            Update promoter configuration
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
            <Label className="text-xs">Bot</Label>
            <div className="mt-1 text-sm text-muted-foreground">
              @{c.bot?.username} (cannot be changed)
            </div>
          </div>

          <div>
            <Label className="text-xs">Vault Group</Label>
            <div className="mt-1 text-sm text-muted-foreground">
              {c.vaultGroup?.title} (cannot be changed)
            </div>
          </div>

          <div>
            <Label className="text-xs">Marketing Group</Label>
            <div className="mt-1 text-sm text-muted-foreground">
              {c.marketingGroup?.title} (cannot be changed)
            </div>
          </div>
        </CardContent>
      </Card>

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
        onClick={() => updateMutation.mutate()}
        disabled={!canSubmit || updateMutation.isPending}
      >
        {updateMutation.isPending ? 'Updating...' : 'Update Promoter'}
      </Button>
    </div>
  )
}
