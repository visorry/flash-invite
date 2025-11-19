"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DollarSign } from 'lucide-react'

interface AddSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    name: string
    email: string
  }
  plans: Array<{
    id: string
    name: string
    price: number
    tokensIncluded: number
  }>
  onSubmit: (userId: string, planId: string) => Promise<void>
}

export function AddSubscriptionDialog({ 
  open, 
  onOpenChange, 
  user, 
  plans,
  onSubmit 
}: AddSubscriptionDialogProps) {
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const selectedPlan = plans.find(p => p.id === selectedPlanId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPlanId) {
      alert('Please select a plan')
      return
    }

    setIsLoading(true)
    try {
      await onSubmit(user.id, selectedPlanId)
      setSelectedPlanId('')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to add subscription:', error)
      alert('Failed to add subscription')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Add Subscription
          </DialogTitle>
          <DialogDescription>
            Add a subscription plan to {user.name}'s account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan">Select Plan *</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price} ({plan.tokensIncluded.toLocaleString()} tokens)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlan && (
              <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                <h4 className="font-medium text-sm">Plan Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Price</p>
                    <p className="font-medium">${selectedPlan.price}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tokens</p>
                    <p className="font-medium">{selectedPlan.tokensIncluded.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedPlanId}>
              {isLoading ? 'Adding...' : 'Add Subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
