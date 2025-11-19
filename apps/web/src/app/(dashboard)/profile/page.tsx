"use client"

import { useSession } from '@/hooks/use-session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Mail, Shield, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, isLoading, logout } = useSession()
  const router = useRouter()

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

  const isAdmin = (user as any)?.isAdmin === true

  return (
    <div className="flex-1 space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Profile</h1>
        <p className="text-xs text-muted-foreground">
          Your account information
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">User</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">User ID</p>
                <p className="text-sm font-mono text-xs">{user.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Admin Panel Button - Only for admins */}
          {isAdmin && (
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => router.push('/admin/dashboard')}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium">Admin Panel</p>
                  <p className="text-xs text-muted-foreground">Manage platform settings</p>
                </div>
              </div>
            </Button>
          )}

          {/* Logout Button */}
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={logout}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium">Logout</p>
                <p className="text-xs text-muted-foreground">Sign out of your account</p>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
