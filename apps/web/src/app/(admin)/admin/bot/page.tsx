"use client"

import { useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { Bot, Users, Clock, Crown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const PAGE_SIZE = 20

export default function AdminBotPage() {
  const { user, isLoading } = useSession()
  const [page, setPage] = useState(1)

  // Fetch bot members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['admin', 'bot-members', page],
    queryFn: async () => {
      return api.admin.listBotMembers({ page, size: PAGE_SIZE })
    },
  })

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin', 'bot-members', 'stats'],
    queryFn: async () => {
      return api.admin.getBotMemberStats()
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

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bot Users</h1>
        <p className="text-muted-foreground">
          All Telegram users who interacted with the bot
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats as any)?.total?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(stats as any)?.activeToday?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(stats as any)?.premiumCount?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      {membersLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : members.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member: any) => (
              <Card key={member.id}>
                <CardContent className="pt-4 space-y-3">
                  {/* User Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {member.firstName} {member.lastName}
                        </p>
                        {member.username && (
                          <p className="text-sm text-muted-foreground">
                            @{member.username}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {member.isPremium && (
                        <Badge variant="secondary" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Telegram ID</span>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {member.telegramUserId}
                      </code>
                    </div>

                    {member.languageCode && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Language</span>
                        <span className="font-medium uppercase">{member.languageCode}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">First Seen</span>
                      <span className="font-medium">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Active</span>
                      <span className="font-medium">
                        {new Date(member.lastActiveAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
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
            <Bot className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">No bot users yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Users will appear here when they interact with the bot
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
