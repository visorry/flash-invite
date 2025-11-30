"use client"

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/use-session'
import { useConfirm } from '@/hooks/use-confirm'
import { Settings, Coins, Bot, Trash2, Zap, CreditCard } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { BotConfigDialog } from '@/components/admin/bot-config-dialog'
import { toast } from 'sonner'

// Duration unit enum values
const DURATION_UNITS = [
  { value: 0, label: 'Minute', description: 'Cost per minute' },
  { value: 1, label: 'Hour', description: 'Cost per hour' },
  { value: 2, label: 'Day', description: 'Cost per day' },
  { value: 3, label: 'Month', description: 'Cost per month (30 days)' },
  { value: 4, label: 'Year', description: 'Cost per year (365 days)' },
]

// Automation feature type enum values
const AUTOMATION_FEATURES = [
  { value: 0, label: 'Auto Approval', description: 'Cost per auto-approval rule' },
  { value: 1, label: 'Forward Rule', description: 'Cost per forward rule' },
]

// Payment gateway enum values
const PAYMENT_GATEWAYS = [
  { value: 0, label: 'Cashfree', description: 'Indian payment gateway' },
  { value: 1, label: 'PhonePe', description: 'Indian UPI & payment gateway' },
]

export default function AdminSettingsPage() {
  const { user, isLoading } = useSession()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()
  const [isBotConfigDialogOpen, setIsBotConfigDialogOpen] = useState(false)
  const [botConfig, setBotConfig] = useState({
    botToken: '',
    botUsername: '',
    botStatus: 'not_configured',
  })
  const [pricingInputs, setPricingInputs] = useState<Record<number, string>>({})
  const [automationInputs, setAutomationInputs] = useState<Record<number, { costPerRule: string; freeRulesAllowed: string }>>({})

  // Token pricing query
  const { data: tokenPricing, isLoading: pricingLoading } = useQuery({
    queryKey: ['admin', 'token-pricing'],
    queryFn: async () => {
      return api.admin.getTokenPricing()
    },
  })

  // Automation pricing query
  const { data: automationPricing, isLoading: automationPricingLoading } = useQuery({
    queryKey: ['admin', 'automation-pricing'],
    queryFn: async () => {
      return api.admin.getAutomationPricing()
    },
  })

  // Initialize pricing inputs from fetched data
  useEffect(() => {
    if (tokenPricing) {
      const inputs: Record<number, string> = {}
        ; (tokenPricing as any[]).forEach((config: any) => {
          inputs[config.durationUnit] = config.costPerUnit.toString()
        })
      setPricingInputs(inputs)
    }
  }, [tokenPricing])

  // Initialize automation inputs from fetched data
  useEffect(() => {
    if (automationPricing) {
      const inputs: Record<number, { costPerRule: string; freeRulesAllowed: string }> = {}
        ; (automationPricing as any[]).forEach((config: any) => {
          inputs[config.featureType] = {
            costPerRule: config.costPerRule.toString(),
            freeRulesAllowed: config.freeRulesAllowed.toString(),
          }
        })
      setAutomationInputs(inputs)
    }
  }, [automationPricing])

  // Upsert pricing mutation
  const upsertPricingMutation = useMutation({
    mutationFn: (data: { durationUnit: number; costPerUnit: number }) =>
      api.admin.upsertTokenPricing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'token-pricing'] })
      toast.success('Token pricing updated')
    },
    onError: () => {
      toast.error('Failed to update pricing')
    },
  })

  // Delete pricing mutation
  const deletePricingMutation = useMutation({
    mutationFn: (durationUnit: number) => api.admin.deleteTokenPricing(durationUnit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'token-pricing'] })
      toast.success('Token pricing removed')
    },
    onError: () => {
      toast.error('Failed to remove pricing')
    },
  })

  // Upsert automation pricing mutation
  const upsertAutomationPricingMutation = useMutation({
    mutationFn: (data: { featureType: number; costPerRule: number; freeRulesAllowed: number }) =>
      api.admin.upsertAutomationPricing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'automation-pricing'] })
      toast.success('Automation pricing updated')
    },
    onError: () => {
      toast.error('Failed to update automation pricing')
    },
  })

  // Delete automation pricing mutation
  const deleteAutomationPricingMutation = useMutation({
    mutationFn: (featureType: number) => api.admin.deleteAutomationPricing(featureType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'automation-pricing'] })
      toast.success('Automation pricing removed')
    },
    onError: () => {
      toast.error('Failed to remove automation pricing')
    },
  })

  // Payment gateways query
  const { data: paymentGateways, isLoading: gatewaysLoading } = useQuery({
    queryKey: ['admin', 'payment-gateways'],
    queryFn: async () => {
      return api.admin.paymentGateways.list()
    },
  })

  // Toggle gateway mutation
  const toggleGatewayMutation = useMutation({
    mutationFn: (id: string) => api.admin.paymentGateways.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-gateways'] })
      toast.success('Payment gateway status updated')
    },
    onError: () => {
      toast.error('Failed to update gateway status')
    },
  })

  // Set default gateway mutation
  const setDefaultGatewayMutation = useMutation({
    mutationFn: (id: string) => api.admin.paymentGateways.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-gateways'] })
      toast.success('Default payment gateway updated')
    },
    onError: () => {
      toast.error('Failed to update default gateway')
    },
  })

  // Configure gateway mutation (create initial config)
  const configureGatewayMutation = useMutation({
    mutationFn: (gateway: number) =>
      api.admin.paymentGateways.upsert({
        gateway,
        isActive: false,
        isDefault: false,
        environment: 'SANDBOX',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-gateways'] })
      toast.success('Payment gateway configured successfully')
    },
    onError: () => {
      toast.error('Failed to configure gateway')
    },
  })

  const handleSavePricing = (durationUnit: number) => {
    const costStr = pricingInputs[durationUnit]
    const cost = parseInt(costStr || '0', 10)
    if (isNaN(cost) || cost < 0) {
      toast.error('Invalid cost value')
      return
    }
    upsertPricingMutation.mutate({ durationUnit, costPerUnit: cost })
  }

  const handleDeletePricing = (durationUnit: number) => {
    deletePricingMutation.mutate(durationUnit)
    setPricingInputs(prev => {
      const newInputs = { ...prev }
      delete newInputs[durationUnit]
      return newInputs
    })
  }

  const getPricingForUnit = (durationUnit: number) => {
    return (tokenPricing as any[])?.find((p: any) => p.durationUnit === durationUnit)
  }

  const handleSaveAutomationPricing = (featureType: number) => {
    const input = automationInputs[featureType]
    const costPerRule = parseInt(input?.costPerRule || '0', 10)
    const freeRulesAllowed = parseInt(input?.freeRulesAllowed || '0', 10)
    if (isNaN(costPerRule) || costPerRule < 0) {
      toast.error('Invalid cost value')
      return
    }
    if (isNaN(freeRulesAllowed) || freeRulesAllowed < 0) {
      toast.error('Invalid free rules value')
      return
    }
    upsertAutomationPricingMutation.mutate({ featureType, costPerRule, freeRulesAllowed })
  }

  const handleDeleteAutomationPricing = (featureType: number) => {
    deleteAutomationPricingMutation.mutate(featureType)
    setAutomationInputs(prev => {
      const newInputs = { ...prev }
      delete newInputs[featureType]
      return newInputs
    })
  }

  const getAutomationPricingForFeature = (featureType: number) => {
    return (automationPricing as any[])?.find((p: any) => p.featureType === featureType)
  }

  // Fetch bot config
  const { data: config } = useQuery({
    queryKey: ['admin', 'config'],
    queryFn: async () => {
      return api.admin.getConfig()
    },
  })

  useEffect(() => {
    if (config) {
      setBotConfig({
        botToken: (config as any).botToken || '',
        botUsername: (config as any).botUsername || '',
        botStatus: (config as any).botStatus || 'not_configured',
      })
    }
  }, [config])

  const handleSaveBotConfig = async (data: { botToken: string; botUsername: string }) => {
    try {
      await api.admin.updateConfig(data)
      toast.success('Bot configuration saved successfully')
      setBotConfig({
        ...data,
        botStatus: 'configured',
      })
    } catch (error) {
      toast.error('Failed to save bot configuration')
      throw error
    }
  }

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

  return (
    <div className="flex-1 space-y-6">
      <ConfirmDialog />
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Platform configuration and settings
        </p>
      </div>

      {/* Token Pricing Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Pricing
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite Link Token Costs</CardTitle>
            <CardDescription>
              Set the token cost for each duration unit. Users will be charged based on their invite duration.
              Leave empty or set to 0 for free.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pricingLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {DURATION_UNITS.map((unit) => {
                  const existingPricing = getPricingForUnit(unit.value)
                  const hasValue = pricingInputs[unit.value] !== undefined && pricingInputs[unit.value] !== ''

                  return (
                    <div key={unit.value} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm font-medium">{unit.label}</Label>
                        <p className="text-xs text-muted-foreground">{unit.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-24"
                          value={pricingInputs[unit.value] || ''}
                          onChange={(e) => setPricingInputs(prev => ({
                            ...prev,
                            [unit.value]: e.target.value
                          }))}
                        />
                        <span className="text-sm text-muted-foreground">tokens</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSavePricing(unit.value)}
                          disabled={upsertPricingMutation.isPending}
                        >
                          Save
                        </Button>
                        {existingPricing && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePricing(unit.value)}
                            disabled={deletePricingMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Automation Pricing Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automation Pricing
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Automation Feature Costs</CardTitle>
            <CardDescription>
              Set the token cost for automation features (auto-approval, forward rules).
              You can configure how many free rules users get before they need to pay tokens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {automationPricingLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {AUTOMATION_FEATURES.map((feature) => {
                  const existingPricing = getAutomationPricingForFeature(feature.value)
                  const input = automationInputs[feature.value] || { costPerRule: '', freeRulesAllowed: '' }

                  return (
                    <div key={feature.value} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">{feature.label}</Label>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                        {existingPricing && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAutomationPricing(feature.value)}
                            disabled={deleteAutomationPricingMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Free Rules Allowed</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="1"
                            value={input.freeRulesAllowed}
                            onChange={(e) => setAutomationInputs(prev => ({
                              ...prev,
                              [feature.value]: {
                                ...prev[feature.value],
                                freeRulesAllowed: e.target.value,
                              }
                            }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Cost Per Additional Rule</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={input.costPerRule}
                              onChange={(e) => setAutomationInputs(prev => ({
                                ...prev,
                                [feature.value]: {
                                  ...prev[feature.value],
                                  costPerRule: e.target.value,
                                }
                              }))}
                            />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">tokens</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSaveAutomationPricing(feature.value)}
                        disabled={upsertAutomationPricingMutation.isPending}
                      >
                        Save
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Gateway Configuration */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Gateways
        </h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Gateway Settings</CardTitle>
            <CardDescription>
              Configure and toggle available payment gateways. Set a default gateway for processing payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gatewaysLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {PAYMENT_GATEWAYS.map((gateway) => {
                  const config = (paymentGateways as any[])?.find((p: any) => p.gateway === gateway.value)
                  const isActive = config?.isActive ?? false
                  const isDefault = config?.isDefault ?? false

                  return (
                    <div key={gateway.value} className="flex items-center justify-between border rounded-lg p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-medium">{gateway.label}</Label>
                          {isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{gateway.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {config ? (
                            <>
                              <Badge variant={isActive ? 'default' : 'outline'}>
                                {isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              {config.environment && (
                                <Badge variant="outline" className="text-xs font-mono">
                                  {config.environment}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="secondary">Not Configured</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {!config ? (
                          <Button
                            size="sm"
                            onClick={() => configureGatewayMutation.mutate(gateway.value)}
                            disabled={configureGatewayMutation.isPending}
                          >
                            Configure
                          </Button>
                        ) : (
                          <>
                            <Switch
                              id={`gateway-${gateway.value}`}
                              checked={isActive}
                              onCheckedChange={() => {
                                if (config?.id) {
                                  toggleGatewayMutation.mutate(config.id)
                                }
                              }}
                              disabled={toggleGatewayMutation.isPending}
                            />

                            {isActive && !isDefault && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDefaultGatewayMutation.mutate(config.id)}
                                disabled={setDefaultGatewayMutation.isPending}
                              >
                                Set Default
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bot Configuration */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5" />
          System Bot Configuration
        </h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default System Bot</CardTitle>
            <CardDescription>
              Configure the main Telegram bot used for user login and system operations.
              This bot will handle all authentication requests and core functionality.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bot Token</p>
                <p className="text-sm font-mono">
                  {botConfig.botToken ? botConfig.botToken : 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bot Username</p>
                <p className="text-sm font-medium">
                  {botConfig.botUsername ? `@${botConfig.botUsername}` : 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge variant={botConfig.botStatus === 'running' ? 'default' : botConfig.botStatus === 'configured' ? 'secondary' : 'outline'}>
                  {botConfig.botStatus === 'running' ? 'Running' : botConfig.botStatus === 'configured' ? 'Configured' : 'Not Configured'}
                </Badge>
              </div>
            </div>
            <Button onClick={() => setIsBotConfigDialogOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              {botConfig.botToken ? 'Update Bot' : 'Configure Bot'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <BotConfigDialog
        open={isBotConfigDialogOpen}
        onOpenChange={setIsBotConfigDialogOpen}
        config={botConfig}
        onSubmit={handleSaveBotConfig}
      />
    </div>
  )
}
