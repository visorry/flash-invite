"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Checkbox } from '@/components/ui/checkbox'

interface CreatePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<void>
  plan?: any // For editing
}

export function CreatePlanDialog({ open, onOpenChange, onSubmit, plan }: CreatePlanDialogProps) {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    description: plan?.description || '',
    type: plan?.type?.toString() || '0',
    interval: plan?.interval?.toString() || '0',
    price: plan?.price?.toString() || '',
    tokensIncluded: plan?.tokensIncluded?.toString() || '',
    maxGroups: plan?.maxGroups?.toString() || '',
    maxInvitesPerDay: plan?.maxInvitesPerDay?.toString() || '',
    isActive: plan?.isActive ?? true,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.price || !formData.tokensIncluded) {
      alert('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      await onSubmit({
        name: formData.name,
        description: formData.description || null,
        type: parseInt(formData.type),
        interval: parseInt(formData.interval),
        price: parseFloat(formData.price),
        tokensIncluded: parseInt(formData.tokensIncluded),
        maxGroups: formData.maxGroups ? parseInt(formData.maxGroups) : null,
        maxInvitesPerDay: formData.maxInvitesPerDay ? parseInt(formData.maxInvitesPerDay) : null,
        isActive: formData.isActive,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save plan:', error)
      alert('Failed to save plan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {plan ? 'Edit Plan' : 'Create New Plan'}
          </DialogTitle>
          <DialogDescription>
            {plan ? 'Update the subscription plan details' : 'Create a new subscription plan for users'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Basic, Premium, Enterprise"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of the plan"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="9.99"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">Billing Interval *</Label>
                <Select value={formData.interval} onValueChange={(value) => setFormData({ ...formData, interval: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Monthly</SelectItem>
                    <SelectItem value="1">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tokens */}
            <div className="space-y-2">
              <Label htmlFor="tokensIncluded">Tokens Included *</Label>
              <Input
                id="tokensIncluded"
                type="number"
                placeholder="1000"
                value={formData.tokensIncluded}
                onChange={(e) => setFormData({ ...formData, tokensIncluded: e.target.value })}
                required
              />
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxGroups">Max Groups (Optional)</Label>
                <Input
                  id="maxGroups"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={formData.maxGroups}
                  onChange={(e) => setFormData({ ...formData, maxGroups: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxInvitesPerDay">Max Invites/Day (Optional)</Label>
                <Input
                  id="maxInvitesPerDay"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={formData.maxInvitesPerDay}
                  onChange={(e) => setFormData({ ...formData, maxInvitesPerDay: e.target.value })}
                />
              </div>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Plan Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Standard</SelectItem>
                  <SelectItem value="1">Premium</SelectItem>
                  <SelectItem value="2">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (users can subscribe to this plan)
              </Label>
            </div>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
