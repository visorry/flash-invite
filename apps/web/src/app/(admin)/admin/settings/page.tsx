"use client"

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/use-session'
import { useConfirm } from '@/hooks/use-confirm'
import { Settings, Coins, DollarSign, Bot, Plus, Edit, Trash2, Clock, Zap } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreatePlanDialog } from '@/components/admin/create-plan-dialog'
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

export default function AdminSettingsPage() {
  const { user, isLoading } = useSession()
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false)
  const [isBotConfigDialogOpen, setIsBotConfigDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
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
      ;(tokenPricing as any[]).forEach((config: any) => {
        inputs[config.durationUnit] = config.costPerUnit.toString()
      })
      setPricingInputs(inputs)
    }
  }, [tokenPricing])

  // Initialize automation inputs from fetched data
  useEffect(() => {
    if (automationPricing) {
      const inputs: Record<number, { costPerRule: string; freeRulesAllowed: string }> = {}
      ;(automationPricing as any[]).forEach((config: any) => {
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

  // Fetch plans
  const { data: plans, isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: async () => {
      return api.admin.listPlans()
    },
  })

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

  const handleCreatePlan = async (data: any) => {
    try {
      await api.admin.createPlan(data)
      toast.success('Plan created successfully')
      refetchPlans()
    } catch (error) {
      toast.error('Failed to create plan')
      throw error
    }
  }

  const handleUpdatePlan = async (data: any) => {
    try {
      await api.admin.updatePlan(selectedPlan.id, data)
      toast.success('Plan updated successfully')
      setSelectedPlan(null)
      refetchPlans()
    } catch (error) {
      toast.error('Failed to update plan')
      throw error
    }
  }

  const handleDeletePlan = async (planId: string) => {
    const confirmed = await confirm({
      title: 'Delete plan?',
      description: 'This will permanently delete this subscription plan. Existing subscribers will not be affected.',
      confirmText: 'Delete',
      destructive: true,
    })
    if (!confirmed) return

    try {
      await api.admin.deletePlan(planId)
      toast.success('Plan deleted successfully')
      refetchPlans()
    } catch (error) {
      toast.error('Failed to delete plan')
    }
  }

  const handleSaveBotConfig = async (data: { botToken: string; botUsername: string }) => {
    try {
      await api.admin.updateConfig(data)
      toast.success('Bot configuration saved successfully')
      setBotConfig(data)
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

      {/* Plans Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Subscription Plans
          </h2>
          <Button onClick={() => {
            setSelectedPlan(null)
            setIsPlanDialogOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>

        {plansLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (plans as any)?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(plans as any).map((plan: any) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-bold text-lg">${plan.price}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Interval</span>
                    <span className="font-medium">{plan.interval === 0 ? 'Monthly' : 'Yearly'}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tokens</span>
                    <span className="font-medium flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      {plan.tokensIncluded.toLocaleString()}
                    </span>
                  </div>

                  {plan.maxGroups && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Max Groups</span>
                      <span className="font-medium">{plan.maxGroups}</span>
                    </div>
                  )}

                  {plan.maxInvitesPerDay && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Max Invites/Day</span>
                      <span className="font-medium">{plan.maxInvitesPerDay}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Subscribers</span>
                    <span className="font-medium">{plan._count?.subscriptions || 0}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPlan(plan)
                        setIsPlanDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">No plans configured</p>
              <Button onClick={() => setIsPlanDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        )}
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
      <CreatePlanDialog
        open={isPlanDialogOpen}
        onOpenChange={setIsPlanDialogOpen}
        plan={selectedPlan}
        onSubmit={selectedPlan ? handleUpdatePlan : handleCreatePlan}
      />

      <BotConfigDialog
        open={isBotConfigDialogOpen}
        onOpenChange={setIsBotConfigDialogOpen}
        config={botConfig}
        onSubmit={handleSaveBotConfig}
      />
    </div>
  )
}
