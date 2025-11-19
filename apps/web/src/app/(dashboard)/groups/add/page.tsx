"use client"

import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bot, ArrowLeft, Info, MessageSquare } from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export default function AddGroupPage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    telegramId: '',
    title: '',
    username: '',
    description: '',
    type: 0, // 0 = Group, 1 = Supergroup, 2 = Channel
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.telegramId || !formData.title) {
      toast.error('Telegram ID and Title are required')
      return
    }

    setIsSubmitting(true)
    try {
      await api.telegramEntities.create(formData)
      toast.success('Group added successfully')
      router.push('/groups')
    } catch (error: any) {
      console.error('Failed to add group:', error)
      toast.error(error.message || 'Failed to add group')
    } finally {
      setIsSubmitting(false)
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
    <div className="flex-1 space-y-6 p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/groups')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Add Telegram Group</h1>
          <p className="text-xs text-muted-foreground">
            Connect your Telegram group or channel
          </p>
        </div>
      </div>

      {/* Instructions Card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Info className="h-5 w-5" />
            How to get your Group ID
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Add{' '}
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                @userinfobot
              </a>{' '}
              to your group/channel
            </li>
            <li>The bot will send you the Chat ID</li>
            <li>Copy the ID (it usually starts with -100)</li>
            <li>Make sure to add our bot as admin with necessary permissions</li>
          </ol>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Group Information
            </CardTitle>
            <CardDescription>
              Enter the details of your Telegram group or channel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Telegram ID */}
            <div className="space-y-2">
              <Label htmlFor="telegramId">
                Telegram Chat ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="telegramId"
                placeholder="-1001234567890"
                value={formData.telegramId}
                onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                The unique identifier for your Telegram group (usually starts with -100)
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Group Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="My Awesome Group"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                The display name for your group
              </p>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">
                Username (Optional)
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">@</span>
                <Input
                  id="username"
                  placeholder="mygroup"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Public username if your group has one (without @)
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="A brief description of your group..."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                A short description of what your group is about
              </p>
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <Label>Group Type</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={formData.type === 0 ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, type: 0 })}
                  className="w-full"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Group
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 1 ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, type: 1 })}
                  className="w-full"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Supergroup
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 2 ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, type: 2 })}
                  className="w-full"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Channel
                </Button>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/groups')}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Adding Group...' : 'Add Group'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
