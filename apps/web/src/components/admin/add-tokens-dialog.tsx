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
import { Coins } from 'lucide-react'

interface AddTokensDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    name: string
    email: string
  }
  onSubmit: (userId: string, amount: number, description: string) => Promise<void>
}

export function AddTokensDialog({ open, onOpenChange, user, onSubmit }: AddTokensDialogProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const tokenAmount = parseInt(amount)
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      alert('Please enter a valid token amount')
      return
    }

    setIsLoading(true)
    try {
      await onSubmit(user.id, tokenAmount, description)
      setAmount('')
      setDescription('')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to add tokens:', error)
      alert('Failed to add tokens')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Add Tokens
          </DialogTitle>
          <DialogDescription>
            Add tokens to {user.name}'s account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Input
                id="user"
                value={`${user.name} (${user.email})`}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Token Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount (e.g., 1000)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="e.g., Admin credit, Bonus tokens"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
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
              {isLoading ? 'Adding...' : 'Add Tokens'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
