"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Gift, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

export function WelcomeBonusConfig() {
  const [amount, setAmount] = useState(100)
  const [enabled, setEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/v1/admin/welcome-bonus-config`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setAmount(data.data.amount)
        setEnabled(data.data.enabled)
      }
    } catch (error) {
      console.error('Failed to fetch welcome bonus config:', error)
      toast.error('Failed to load configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/v1/admin/welcome-bonus-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ amount, enabled }),
      })

      if (response.ok) {
        toast.success('Welcome bonus configuration updated successfully')
      } else {
        const data = await response.json()
        toast.error(data.error?.message || 'Failed to update configuration')
      }
    } catch (error) {
      console.error('Failed to update welcome bonus config:', error)
      toast.error('Failed to update configuration')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Welcome Bonus Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Welcome Bonus Configuration
        </CardTitle>
        <CardDescription>
          Configure the welcome bonus tokens given to new users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="enabled">Enable Welcome Bonus</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, new users will receive tokens upon claiming
            </p>
          </div>
          <Switch
            id="enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Token Amount</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            max="10000"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            disabled={!enabled}
            className="max-w-xs"
          />
          <p className="text-sm text-muted-foreground">
            Number of tokens to give to new users (0-10,000)
          </p>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving || !enabled && amount === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {enabled && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium">Preview</p>
            <p className="text-sm text-muted-foreground mt-1">
              New users will receive <span className="font-semibold text-primary">{amount} tokens</span> when they click "Claim Now" in the welcome popup.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
