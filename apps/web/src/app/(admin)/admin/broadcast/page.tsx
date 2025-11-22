"use client"

import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import {
  Send,
  FileText,
  Users,
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
  Crown,
  Globe
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

export default function AdminBroadcastPage() {
  const { user, isLoading } = useSession()
  const queryClient = useQueryClient()

  // Template state
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateContent, setTemplateContent] = useState('')
  const [templateParseMode, setTemplateParseMode] = useState<string>('')
  const [templateButtons, setTemplateButtons] = useState<Array<Array<{text: string; url: string}>>>([])

  // Broadcast state
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false)
  const [broadcastContent, setBroadcastContent] = useState('')
  const [broadcastParseMode, setBroadcastParseMode] = useState<string>('')
  const [broadcastButtons, setBroadcastButtons] = useState<Array<Array<{text: string; url: string}>>>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])

  // Filter state
  const [filterPremium, setFilterPremium] = useState<boolean | undefined>(undefined)
  const [filterLanguage, setFilterLanguage] = useState('')
  const [filterActiveDays, setFilterActiveDays] = useState<number | undefined>(undefined)

  // Fetch templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['admin', 'broadcast-templates'],
    queryFn: () => api.admin.listBroadcastTemplates({ size: 100 }),
  })
  const templates = (templatesData as any)?.items || []

  // Fetch broadcasts history
  const { data: broadcastsData, isLoading: broadcastsLoading } = useQuery({
    queryKey: ['admin', 'broadcasts'],
    queryFn: () => api.admin.listBroadcasts({ size: 50 }),
  })
  const broadcasts = (broadcastsData as any)?.items || []

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin', 'broadcast-stats'],
    queryFn: () => api.admin.getBroadcastStats(),
  })

  // Fetch filtered recipients
  const { data: recipientsData, isLoading: recipientsLoading } = useQuery({
    queryKey: ['admin', 'broadcast-recipients', filterPremium, filterLanguage, filterActiveDays],
    queryFn: () => api.admin.getBroadcastRecipients({
      size: 500,
      isPremium: filterPremium,
      languageCode: filterLanguage || undefined,
      activeWithinDays: filterActiveDays,
    }),
  })
  const recipients = (recipientsData as any)?.items || []

  // Template mutations
  const createTemplateMutation = useMutation({
    mutationFn: (data: { name: string; content: string; parseMode?: string; buttons?: any }) =>
      api.admin.createBroadcastTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'broadcast-templates'] })
      setShowTemplateDialog(false)
      resetTemplateForm()
      toast.success('Template created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create template')
    },
  })

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.admin.updateBroadcastTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'broadcast-templates'] })
      setShowTemplateDialog(false)
      resetTemplateForm()
      toast.success('Template updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update template')
    },
  })

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => api.admin.deleteBroadcastTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'broadcast-templates'] })
      toast.success('Template deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete template')
    },
  })

  // Broadcast mutation
  const sendBroadcastMutation = useMutation({
    mutationFn: (data: {
      templateId?: string;
      content: string;
      parseMode?: string;
      buttons?: any;
      recipientIds: string[];
    }) => api.admin.sendBroadcast(data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'broadcasts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'broadcast-stats'] })
      setShowBroadcastDialog(false)
      resetBroadcastForm()
      toast.success(`Broadcast sent to ${data?.sentCount || selectedRecipients.length} recipients`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send broadcast')
    },
  })

  const resetTemplateForm = () => {
    setEditingTemplate(null)
    setTemplateName('')
    setTemplateContent('')
    setTemplateParseMode('')
    setTemplateButtons([])
  }

  const resetBroadcastForm = () => {
    setBroadcastContent('')
    setBroadcastParseMode('')
    setBroadcastButtons([])
    setSelectedTemplateId('')
    setSelectedRecipients([])
  }

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template)
    setTemplateName(template.name)
    setTemplateContent(template.content)
    setTemplateParseMode(template.parseMode || '')
    setTemplateButtons(template.buttons || [])
    setShowTemplateDialog(true)
  }

  const handleSaveTemplate = () => {
    const data = {
      name: templateName,
      content: templateContent,
      parseMode: templateParseMode || undefined,
      buttons: templateButtons.length > 0 ? templateButtons : undefined,
    }

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data })
    } else {
      createTemplateMutation.mutate(data)
    }
  }

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const template = templates?.find((t: any) => t.id === templateId)
    if (template) {
      setBroadcastContent(template.content)
      setBroadcastParseMode(template.parseMode || '')
      setBroadcastButtons(template.buttons || [])
    }
  }

  // Button management helpers
  const addButtonRow = (isTemplate: boolean) => {
    if (isTemplate) {
      setTemplateButtons([...templateButtons, [{ text: '', url: '' }]])
    } else {
      setBroadcastButtons([...broadcastButtons, [{ text: '', url: '' }]])
    }
  }

  const addButtonToRow = (rowIndex: number, isTemplate: boolean) => {
    if (isTemplate) {
      const newButtons = [...templateButtons]
      newButtons[rowIndex] = [...newButtons[rowIndex], { text: '', url: '' }]
      setTemplateButtons(newButtons)
    } else {
      const newButtons = [...broadcastButtons]
      newButtons[rowIndex] = [...newButtons[rowIndex], { text: '', url: '' }]
      setBroadcastButtons(newButtons)
    }
  }

  const updateButton = (rowIndex: number, buttonIndex: number, field: 'text' | 'url', value: string, isTemplate: boolean) => {
    if (isTemplate) {
      const newButtons = [...templateButtons]
      newButtons[rowIndex][buttonIndex] = { ...newButtons[rowIndex][buttonIndex], [field]: value }
      setTemplateButtons(newButtons)
    } else {
      const newButtons = [...broadcastButtons]
      newButtons[rowIndex][buttonIndex] = { ...newButtons[rowIndex][buttonIndex], [field]: value }
      setBroadcastButtons(newButtons)
    }
  }

  const removeButton = (rowIndex: number, buttonIndex: number, isTemplate: boolean) => {
    if (isTemplate) {
      const newButtons = [...templateButtons]
      newButtons[rowIndex].splice(buttonIndex, 1)
      if (newButtons[rowIndex].length === 0) {
        newButtons.splice(rowIndex, 1)
      }
      setTemplateButtons(newButtons)
    } else {
      const newButtons = [...broadcastButtons]
      newButtons[rowIndex].splice(buttonIndex, 1)
      if (newButtons[rowIndex].length === 0) {
        newButtons.splice(rowIndex, 1)
      }
      setBroadcastButtons(newButtons)
    }
  }

  const handleSelectAllRecipients = () => {
    if (recipients) {
      setSelectedRecipients(recipients.map((r: any) => r.id))
    }
  }

  const handleClearRecipients = () => {
    setSelectedRecipients([])
  }

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev =>
      prev.includes(id)
        ? prev.filter(r => r !== id)
        : [...prev, id]
    )
  }

  const handleSendBroadcast = () => {
    if (!broadcastContent || selectedRecipients.length === 0) return

    sendBroadcastMutation.mutate({
      templateId: selectedTemplateId || undefined,
      content: broadcastContent,
      parseMode: broadcastParseMode || undefined,
      buttons: broadcastButtons.length > 0 ? broadcastButtons : undefined,
      recipientIds: selectedRecipients,
    })
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge variant="secondary">Pending</Badge>
      case 1:
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 2:
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
      case 3:
        return <Badge variant="destructive">Failed</Badge>
      case 4:
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
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
        <h1 className="text-3xl font-bold">Broadcast</h1>
        <p className="text-muted-foreground">
          Send messages to bot users and manage templates
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Broadcasts</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats as any)?.totalBroadcasts || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(stats as any)?.totalMessagesSent?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats as any)?.recentBroadcasts || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send">Send Broadcast</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Send Broadcast Tab */}
        <TabsContent value="send" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Message Composition */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compose Message</CardTitle>
                <CardDescription>Write your broadcast message</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Selection */}
                <div className="space-y-2">
                  <Label>Use Template (Optional)</Label>
                  <Select value={selectedTemplateId || "none"} onValueChange={(v) => handleSelectTemplate(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No template</SelectItem>
                      {templates.map((template: any) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Message Content */}
                <div className="space-y-2">
                  <Label>Message Content</Label>
                  <Textarea
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value)}
                    placeholder="Enter your message..."
                    rows={6}
                  />
                </div>

                {/* Parse Mode */}
                <div className="space-y-2">
                  <Label>Parse Mode</Label>
                  <Select value={broadcastParseMode || "plain"} onValueChange={(v) => setBroadcastParseMode(v === "plain" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Plain text" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plain">Plain Text</SelectItem>
                      <SelectItem value="HTML">HTML</SelectItem>
                      <SelectItem value="Markdown">Markdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Inline Buttons */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Inline Buttons</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addButtonRow(false)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Row
                    </Button>
                  </div>
                  {broadcastButtons.map((row, rowIndex) => (
                    <div key={rowIndex} className="space-y-2 p-2 border rounded-md">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Row {rowIndex + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => addButtonToRow(rowIndex, false)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      {row.map((button, buttonIndex) => (
                        <div key={buttonIndex} className="flex gap-2 items-start">
                          <div className="flex-1 space-y-1">
                            <Input
                              placeholder="Button text"
                              value={button.text}
                              onChange={(e) => updateButton(rowIndex, buttonIndex, 'text', e.target.value, false)}
                              className="h-8 text-sm"
                            />
                            <Input
                              placeholder="https://..."
                              value={button.url}
                              onChange={(e) => updateButton(rowIndex, buttonIndex, 'url', e.target.value, false)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeButton(rowIndex, buttonIndex, false)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  onClick={handleSendBroadcast}
                  disabled={!broadcastContent || selectedRecipients.length === 0 || sendBroadcastMutation.isPending}
                >
                  {sendBroadcastMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send to {selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Recipient Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Recipients</CardTitle>
                <CardDescription>Filter and select bot users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Premium Status</Label>
                      <Select
                        value={filterPremium === undefined ? 'all' : filterPremium.toString()}
                        onValueChange={(v) => setFilterPremium(v === 'all' ? undefined : v === 'true')}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="true">Premium Only</SelectItem>
                          <SelectItem value="false">Non-Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Active Within</Label>
                      <Select
                        value={filterActiveDays?.toString() || 'any'}
                        onValueChange={(v) => setFilterActiveDays(v === 'any' ? undefined : parseInt(v))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Any time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any time</SelectItem>
                          <SelectItem value="1">Last 24h</SelectItem>
                          <SelectItem value="7">Last 7 days</SelectItem>
                          <SelectItem value="30">Last 30 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Language Code</Label>
                    <Input
                      className="h-8"
                      placeholder="e.g., en, ru"
                      value={filterLanguage}
                      onChange={(e) => setFilterLanguage(e.target.value)}
                    />
                  </div>
                </div>

                {/* Selection Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAllRecipients}>
                    Select All ({recipients.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearRecipients}>
                    Clear
                  </Button>
                </div>

                {/* Recipients List */}
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  {recipientsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : recipients.length > 0 ? (
                    <div className="divide-y">
                      {recipients.map((recipient: any) => (
                        <label
                          key={recipient.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedRecipients.includes(recipient.id)}
                            onCheckedChange={() => toggleRecipient(recipient.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {recipient.firstName} {recipient.lastName}
                            </p>
                            {recipient.username && (
                              <p className="text-xs text-muted-foreground">@{recipient.username}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {recipient.isPremium && (
                              <Crown className="h-3 w-3 text-purple-500" />
                            )}
                            {recipient.languageCode && (
                              <span className="text-xs text-muted-foreground uppercase">
                                {recipient.languageCode}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">No recipients found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Message Templates</h2>
            <Button onClick={() => setShowTemplateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          {templatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template: any) => (
                <Card key={template.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.content}
                    </p>
                    {template.parseMode && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {template.parseMode}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground">No templates yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create templates to reuse messages
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <h2 className="text-lg font-semibold">Broadcast History</h2>

          {broadcastsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : broadcasts.length > 0 ? (
            <div className="space-y-3">
              {broadcasts.map((broadcast: any) => (
                <Card key={broadcast.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(broadcast.status)}
                          {broadcast.template && (
                            <Badge variant="outline" className="text-xs">
                              {broadcast.template.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {broadcast.content}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">
                          {broadcast.sentCount}/{broadcast.totalRecipients}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(broadcast.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {broadcast.failedCount > 0 && (
                      <p className="text-xs text-destructive mt-2">
                        {broadcast.failedCount} failed
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Send className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground">No broadcasts yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Send your first broadcast to see it here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Update your message template'
                : 'Create a reusable message template'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Welcome Message"
              />
            </div>

            <div className="space-y-2">
              <Label>Message Content</Label>
              <Textarea
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                placeholder="Enter your message..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Parse Mode</Label>
              <Select value={templateParseMode || "plain"} onValueChange={(v) => setTemplateParseMode(v === "plain" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Plain text" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain">Plain Text</SelectItem>
                  <SelectItem value="HTML">HTML</SelectItem>
                  <SelectItem value="Markdown">Markdown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Inline Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Inline Buttons (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addButtonRow(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Row
                </Button>
              </div>
              {templateButtons.map((row, rowIndex) => (
                <div key={rowIndex} className="space-y-2 p-2 border rounded-md">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Row {rowIndex + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => addButtonToRow(rowIndex, true)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {row.map((button, buttonIndex) => (
                    <div key={buttonIndex} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1">
                        <Input
                          placeholder="Button text"
                          value={button.text}
                          onChange={(e) => updateButton(rowIndex, buttonIndex, 'text', e.target.value, true)}
                          className="h-8 text-sm"
                        />
                        <Input
                          placeholder="https://..."
                          value={button.url}
                          onChange={(e) => updateButton(rowIndex, buttonIndex, 'url', e.target.value, true)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeButton(rowIndex, buttonIndex, true)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowTemplateDialog(false)
              resetTemplateForm()
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!templateName || !templateContent || createTemplateMutation.isPending || updateTemplateMutation.isPending}
            >
              {(createTemplateMutation.isPending || updateTemplateMutation.isPending) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
