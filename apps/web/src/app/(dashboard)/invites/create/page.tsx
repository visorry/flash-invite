"use client"

import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Link as LinkIcon, ArrowLeft, Clock, Users, Copy, Check } from 'lucide-react'
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

const DURATION_OPTIONS = [
  { value: '3600', label: '1 Hour', seconds: 3600 },
  { value: '21600', label: '6 Hours', seconds: 21600 },
  { value: '43200', label: '12 Hours', seconds: 43200 },
  { value: '86400', label: '1 Day', seconds: 86400 },
  { value: '259200', label: '3 Days', seconds: 259200 },
  { value: '604800', label: '7 Days', seconds: 604800 },
  { value: '2592000', label: '30 Days', seconds: 2592000 },
]

export default function CreateInvitePage() {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('groupId')

  const [formData, setFormData] = useState({
    telegramEntityId: groupId || '',
    durationSeconds: '86400', // 1 day default
    memberLimit: '',
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
    
    if (!formData.telegramEntityId || !formData.durationSeconds) {
      toast.error('Please select a group and duration')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await api.invites.create({
        telegramEntityId: formData.telegramEntityId,
        durationSeconds: parseInt(formData.durationSeconds),
        memberLimit: formData.memberLimit ? parseInt(formData.memberLimit) : null,
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
                <Button onClick={copyToClipboard} variant="outline">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {DURATION_OPTIONS.find(d => d.value === formData.durationSeconds)?.label}
                </p>
              </div>
              {formData.memberLimit && (
                <div>
                  <p className="text-muted-foreground">Member Limit</p>
                  <p className="font-medium">{formData.memberLimit} users</p>
                </div>
              )}
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
                    durationSeconds: '86400',
                    memberLimit: '',
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
              <Select
                value={formData.durationSeconds}
                onValueChange={(value) => setFormData({ ...formData, durationSeconds: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How long the user can stay in the group after joining
              </p>
            </div>

            {/* Member Limit */}
            <div className="space-y-2">
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
            </div>

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
