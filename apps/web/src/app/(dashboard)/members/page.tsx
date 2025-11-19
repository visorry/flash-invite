"use client"

import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { Users, Clock, Calendar, UserCheck, UserX, Filter } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function MembersPage() {
  const { user, isLoading } = useSession()
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('joined-desc')

  // Fetch groups for filter
  const { data: groups } = useQuery({
    queryKey: ['telegram-entities'],
    queryFn: async () => {
      return api.telegramEntities.list()
    },
  })

  // Fetch members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members', filterGroup, filterStatus, sortBy],
    queryFn: async () => {
      const params: any = {}
      if (filterGroup !== 'all') {
        params.telegramEntityId = filterGroup
      }
      if (filterStatus !== 'all') {
        params.isActive = filterStatus
      }
      
      // Parse sort parameter
      const [field, order] = sortBy.split('-')
      params.sort = field
      params.order = order
      
      return api.members.list(params)
    },
  })

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

  const formatDuration = (expiresAt: string, joinedAt: string) => {
    const duration = new Date(expiresAt).getTime() - new Date(joinedAt).getTime()
    const days = Math.floor(duration / (1000 * 60 * 60 * 24))
    const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) {
      return `${days}d ${hours}h`
    }
    return `${hours}h`
  }

  const getStatusBadge = (member: any) => {
    const now = new Date()
    const expiresAt = new Date(member.expiresAt)
    
    if (member.kickedAt) {
      return <Badge variant="destructive">Kicked</Badge>
    }
    if (!member.isActive) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (expiresAt < now) {
      return <Badge variant="outline">Expired</Badge>
    }
    return <Badge className="bg-green-500">Active</Badge>
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) {
      return 'Expired'
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    }
    return `${minutes}m remaining`
  }

  return (
    <div className="flex-1 space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Members</h1>
          <p className="text-xs text-muted-foreground">
            Track users who joined through your invite links
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Sort
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {(groups as any)?.items?.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="joined-desc">Newest First</SelectItem>
                  <SelectItem value="joined-asc">Oldest First</SelectItem>
                  <SelectItem value="expires-asc">Expiring Soon</SelectItem>
                  <SelectItem value="expires-desc">Expiring Later</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{(members as any)?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {(members as any)?.items?.filter((m: any) => m.isActive && new Date(m.expiresAt) > new Date()).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {(members as any)?.items?.filter((m: any) => new Date(m.expiresAt) < new Date() && !m.kickedAt).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {(members as any)?.items?.filter((m: any) => m.kickedAt).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Kicked</p>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      {membersLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (members as any)?.items?.length > 0 ? (
        <div className="space-y-3">
          {(members as any).items.map((member: any) => (
            <Card key={member.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {member.fullName || 'Unknown User'}
                      {getStatusBadge(member)}
                    </CardTitle>
                    {member.username && (
                      <p className="text-xs text-muted-foreground mt-1">
                        @{member.username}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Group Info */}
                {member.telegramEntity && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Group: </span>
                    <span className="font-medium">{member.telegramEntity.title}</span>
                  </div>
                )}

                {/* Timeline */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <UserCheck className="h-3 w-3 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Joined</p>
                      <p className="font-medium">
                        {new Date(member.joinedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-3 w-3 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Expires</p>
                      <p className="font-medium">
                        {new Date(member.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Duration & Status */}
                <div className="flex items-center justify-between text-xs pt-2 border-t">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Duration: {formatDuration(member.expiresAt, member.joinedAt)}</span>
                  </div>
                  <div className="font-medium">
                    {member.kickedAt ? (
                      <span className="text-red-600">
                        Kicked {new Date(member.kickedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className={new Date(member.expiresAt) > new Date() ? 'text-green-600' : 'text-orange-600'}>
                        {getTimeRemaining(member.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Telegram User ID */}
                <div className="text-xs text-muted-foreground">
                  Telegram ID: <code className="bg-muted px-1 py-0.5 rounded">{member.telegramUserId}</code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">No members yet</p>
            <Button onClick={() => window.location.href = '/invites/create'}>
              Create Invite Link
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
