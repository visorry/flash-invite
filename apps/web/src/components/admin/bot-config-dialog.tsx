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
import { Bot } from 'lucide-react'

interface BotConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: {
    botToken?: string
    botUsername?: string
  }
  onSubmit: (data: { botToken: string; botUsername: string }) => Promise<void>
}

export function BotConfigDialog({ open, onOpenChange, config, onSubmit }: BotConfigDialogProps) {
  const [formData, setFormData] = useState({
    botToken: config.botToken || '',
    botUsername: config.botUsername || '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.botToken || !formData.botUsername) {
      alert('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save bot config:', error)
      alert('Failed to save bot configuration')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Telegram Bot Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your Telegram bot credentials
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="botToken">Bot Token *</Label>
              <Input
                id="botToken"
                type="password"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={formData.botToken}
                onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Get this from @BotFather on Telegram
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="botUsername">Bot Username *</Label>
              <Input
                id="botUsername"
                placeholder="@YourBotUsername"
                value={formData.botUsername}
                onChange={(e) => setFormData({ ...formData, botUsername: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Your bot's username (with or without @)
              </p>
            </div>

            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium text-sm mb-2">⚠️ Important</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Keep your bot token secure and never share it</li>
                <li>• Changes will require server restart to take effect</li>
                <li>• Make sure the bot has admin rights in your groups</li>
              </ul>
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
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
