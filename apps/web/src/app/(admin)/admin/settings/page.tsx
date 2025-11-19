"use client"

import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { Settings, Coins, DollarSign, Bot, Plus, Edit, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreatePlanDialog } from '@/components/admin/create-plan-dialog'
import { BotConfigDialog } from '@/components/admin/bot-config-dialog'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const { user, isLoading } = useSession()
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false)
  const [isBotConfigDialogOpen, setIsBotConfigDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [botConfig, setBotConfig] = useState({
    botToken: '',
    botUsername: '',
  })

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
    onSuccess: (data: any) => {
      if (data) {
        setBotConfig({
          botToken: data.botToken || '',
          botUsername: data.botUsername || '',
        })
      }
    },
  })

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
    if (!confirm('Are you sure you want to delete this plan?')) return
    
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

      {/* Bot Configuration */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Telegram Bot Configuration
        </h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bot Credentials</CardTitle>
            <CardDescription>Configure your Telegram bot token and username</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bot Token</p>
                <p className="text-sm font-mono">
                  {botConfig.botToken ? '••••••••••••••••' : 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bot Username</p>
                <p className="text-sm font-medium">
                  {botConfig.botUsername || 'Not configured'}
                </p>
              </div>
            </div>
            <Button onClick={() => setIsBotConfigDialogOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configure Bot
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
