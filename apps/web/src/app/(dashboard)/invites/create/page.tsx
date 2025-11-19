"use client"

import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Link as LinkIcon, ArrowLeft, Clock, Users, Copy, Check, Share2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const TIME_UNITS = [
  { value: 'minutes', label: 'Minutes', multiplier: 60 },
  { value: 'hours', label: 'Hours', multiplier: 3600 },
  { value: 'days', label: 'Days', multiplier: 86400 },
  { value: 'months', label: 'Months', multiplier: 2592000 }, // 30 days
  { value: 'years', label: 'Years', multiplier: 31536000 }, // 365 days
]

export default function CreateInvitePage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('groupId')

  const [formData, setFormData] = useState({
    telegramEntityId: groupId || '',
    durationValue: '1',
    durationUnit: 'days',
    // memberLimit: '', // Commented out - defaults to 1 on server
    name: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdInvite, setCreatedInvite] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Fetch groups
  const { data: groups } = useQuery({
    queryKey: ['telegram-entities'],
    queryFn: async () => {
      return api.telegramEntities.list()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.telegramEntityId || !formData.durationValue) {
      toast.error('Please select a group and duration')
      return
    }

    setIsSubmitting(true)
    try {
      // Calculate duration in seconds
      const unit = TIME_UNITS.find(u => u.value === formData.durationUnit)
      const durationSeconds = parseInt(formData.durationValue) * (unit?.multiplier || 86400)

      const result = await api.invites.create({
        telegramEntityId: formData.telegramEntityId,
        durationSeconds,
        // memberLimit: formData.memberLimit ? parseInt(formData.memberLimit) : null, // Defaults to 1 on server
        name: formData.name || null,
      })
      
      setCreatedInvite(result)
      toast.success('Invite link created successfully')
    } catch (error: any) {
      console.error('Failed to create invite:', error)
      toast.error(error.message || 'Failed to create invite link')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = () => {
    if (createdInvite?.inviteLink) {
      navigator.clipboard.writeText(createdInvite.inviteLink)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareInvite = () => {
    if (createdInvite?.inviteLink) {
      if (navigator.share) {
        navigator.share({
          title: 'Join Group Invite',
          text: 'Click this link to join the group',
          url: createdInvite.inviteLink,
        }).catch(() => {
          // Fallback to copy if share fails
          copyToClipboard()
        })
      } else {
        // Fallback to copy if Web Share API not supported
        copyToClipboard()
      }
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

  // Show success screen if invite created
  if (createdInvite) {
    return (
      <div className="flex-1 space-y-6 p-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/invites')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invites
          </Button>
        </div>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100">
              ✅ Invite Link Created Successfully!
            </CardTitle>
            <CardDescription className="text-green-800 dark:text-green-200">
              Share this link with users to join your group
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Your Invite Link</Label>
              <div className="flex gap-2">
                <Input
                  value={createdInvite.inviteLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={copyToClipboard} variant="outline" size="icon">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button onClick={shareInvite} variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {formData.durationValue} {TIME_UNITS.find(u => u.value === formData.durationUnit)?.label}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Usage</p>
                <p className="font-medium">One-time use</p>
              </div>
              <div>
                <p className="text-muted-foreground">Expires At</p>
                <p className="font-medium">
                  {new Date(createdInvite.expiresAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium text-green-600">Active</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setCreatedInvite(null)
                  setFormData({
                    telegramEntityId: groupId || '',
                    durationValue: '1',
                    durationUnit: 'days',
                    // memberLimit: '', // Commented out
                    name: '',
                  })
                }}
                variant="outline"
                className="flex-1"
              >
                Create Another
              </Button>
              <Button
                onClick={() => router.push('/invites')}
                className="flex-1"
              >
                View All Invites
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/invites')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Create Invite Link</h1>
          <p className="text-xs text-muted-foreground">
            Generate a new invite link for your group
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Invite Configuration
            </CardTitle>
            <CardDescription>
              Configure the invite link settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Group Selection */}
            <div className="space-y-2">
              <Label htmlFor="group">
                Select Group <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.telegramEntityId}
                onValueChange={(value) => setFormData({ ...formData, telegramEntityId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a group" />
                </SelectTrigger>
                <SelectContent>
                  {(groups as any)?.items?.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">
                <Clock className="h-4 w-4 inline mr-2" />
                Invite Duration <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="durationValue"
                  type="number"
                  placeholder="1"
                  value={formData.durationValue}
                  onChange={(e) => setFormData({ ...formData, durationValue: e.target.value })}
                  min="1"
                  className="flex-1"
                />
                <Select
                  value={formData.durationUnit}
                  onValueChange={(value) => setFormData({ ...formData, durationUnit: value })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                How long the user can stay in the group after joining
              </p>
            </div>

            {/* Member Limit - Commented out, defaults to 1 (one-time use) */}
            {/* <div className="space-y-2">
              <Label htmlFor="memberLimit">
                <Users className="h-4 w-4 inline mr-2" />
                Member Limit (Optional)
              </Label>
              <Input
                id="memberLimit"
                type="number"
                placeholder="Leave empty for unlimited"
                value={formData.memberLimit}
                onChange={(e) => setFormData({ ...formData, memberLimit: e.target.value })}
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of users who can use this invite link
              </p>
            </div> */}

            {/* Name/Label */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Label (Optional)
              </Label>
              <Input
                id="name"
                placeholder="e.g., Premium Members, VIP Access"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                A label to help you identify this invite link
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/invites')}
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
                {isSubmitting ? 'Creating...' : 'Create Invite Link'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
