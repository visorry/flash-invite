"use client"

import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { Users, Clock, Calendar, UserCheck, UserX, Filter, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

const PAGE_SIZE = 10

export default function MembersPage() {
  const { user, isLoading } = useSession()
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  // Applied filters
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('joined-desc')

  // Temp filters for drawer
  const [tempFilterGroup, setTempFilterGroup] = useState<string>('all')
  const [tempFilterStatus, setTempFilterStatus] = useState<string>('all')
  const [tempSortBy, setTempSortBy] = useState<string>('joined-desc')

  const hasActiveFilters = filterGroup !== 'all' || filterStatus !== 'all' || sortBy !== 'joined-desc'

  const handleApplyFilters = () => {
    setFilterGroup(tempFilterGroup)
    setFilterStatus(tempFilterStatus)
    setSortBy(tempSortBy)
    setPage(1) // Reset to first page when filters change
    setShowFilters(false)
  }

  const handleResetFilters = () => {
    setTempFilterGroup('all')
    setTempFilterStatus('all')
    setTempSortBy('joined-desc')
  }

  const handleOpenFilters = () => {
    setTempFilterGroup(filterGroup)
    setTempFilterStatus(filterStatus)
    setTempSortBy(sortBy)
    setShowFilters(true)
  }

  // Fetch groups for filter
  const { data: groups } = useQuery({
    queryKey: ['telegram-entities'],
    queryFn: async () => {
      return api.telegramEntities.list()
    },
  })

  // Fetch members with pagination
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['members', filterGroup, filterStatus, sortBy, page],
    queryFn: async () => {
      const params: any = {
        page,
        size: PAGE_SIZE,
      }
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

  const members = (membersData as any)?.items || []
  const total = (membersData as any)?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

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
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return `${days}d ${hours}h`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getStatusBadge = (member: any) => {
    const now = new Date()
    const expiresAt = new Date(member.memberExpiresAt)

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
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          onClick={handleOpenFilters}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active:</span>
          {filterGroup !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Group: {(groups as any)?.items?.find((g: any) => g.id === filterGroup)?.title || 'Selected'}
            </Badge>
          )}
          {filterStatus !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Status: {filterStatus === 'true' ? 'Active' : 'Inactive'}
            </Badge>
          )}
          {sortBy !== 'joined-desc' && (
            <Badge variant="secondary" className="text-xs">
              Sort: {sortBy === 'joined-asc' ? 'Oldest' : sortBy === 'expires-asc' ? 'Expiring Soon' : 'Expiring Later'}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => {
              setFilterGroup('all')
              setFilterStatus('all')
              setSortBy('joined-desc')
            }}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      )}

      {/* Stats - Compact */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {members.filter((m: any) => m.isActive && new Date(m.memberExpiresAt) > new Date()).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {members.filter((m: any) => new Date(m.memberExpiresAt) < new Date() && !m.kickedAt).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {members.filter((m: any) => m.kickedAt).length || 0}
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
      ) : members.length > 0 ? (
        <div className="space-y-3">
          {members.map((member: any) => (
            <Card key={member.id}>
              <CardContent className="pt-4 pb-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">
                        {member.fullName || 'Unknown User'}
                      </p>
                      {getStatusBadge(member)}
                    </div>
                    {member.username && (
                      <p className="text-xs text-muted-foreground truncate">
                        @{member.username}
                      </p>
                    )}
                  </div>
                </div>

                {/* Group Info */}
                {member.telegramEntity && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Group: </span>
                    <span className="font-medium">{member.telegramEntity.title}</span>
                  </div>
                )}

                {/* Timeline - Mobile Optimized */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-muted-foreground">Joined</p>
                      <p className="font-medium truncate">
                        {new Date(member.joinedAt).toLocaleString(undefined, { 
                          dateStyle: 'short', 
                          timeStyle: 'short' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-orange-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-muted-foreground">Expires</p>
                      <p className="font-medium truncate">
                        {new Date(member.memberExpiresAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Duration & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs pt-2 border-t">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>{formatDuration(member.memberExpiresAt, member.joinedAt)}</span>
                  </div>
                  <div className="font-medium">
                    {member.kickedAt ? (
                      <span className="text-red-600">
                        Kicked {new Date(member.kickedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className={new Date(member.memberExpiresAt) > new Date() ? 'text-green-600' : 'text-orange-600'}>
                        {getTimeRemaining(member.memberExpiresAt)}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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

      {/* Filter Drawer */}
      <Drawer open={showFilters} onOpenChange={setShowFilters}>
        <DrawerContent className="flex flex-col max-h-[85vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle>Sort & Filters</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {/* Group Filter */}
            <div className="space-y-3">
              <Label>Group</Label>
              <Select value={tempFilterGroup} onValueChange={setTempFilterGroup}>
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

            {/* Status Filter */}
            <div className="space-y-3">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={tempFilterStatus === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTempFilterStatus('all')}
                  className="text-xs"
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant={tempFilterStatus === 'true' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTempFilterStatus('true')}
                  className="text-xs"
                >
                  Active
                </Button>
                <Button
                  type="button"
                  variant={tempFilterStatus === 'false' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTempFilterStatus('false')}
                  className="text-xs"
                >
                  Inactive
                </Button>
              </div>
            </div>

            {/* Sort By */}
            <div className="space-y-3">
              <Label>Sort By</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={tempSortBy === 'joined-desc' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTempSortBy('joined-desc')}
                  className="text-xs"
                >
                  Newest First
                </Button>
                <Button
                  type="button"
                  variant={tempSortBy === 'joined-asc' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTempSortBy('joined-asc')}
                  className="text-xs"
                >
                  Oldest First
                </Button>
                <Button
                  type="button"
                  variant={tempSortBy === 'expires-asc' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTempSortBy('expires-asc')}
                  className="text-xs"
                >
                  Expiring Soon
                </Button>
                <Button
                  type="button"
                  variant={tempSortBy === 'expires-desc' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTempSortBy('expires-desc')}
                  className="text-xs"
                >
                  Expiring Later
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleResetFilters}
              >
                Reset All
              </Button>
              <Button
                className="flex-1"
                onClick={handleApplyFilters}
              >
                Apply
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
