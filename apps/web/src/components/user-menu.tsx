"use client"

import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { User, LogOut, Shield } from 'lucide-react'
import Link from 'next/link'

export function UserMenu() {
  const { user, logout } = useSession()

  if (!user) {
    return (
      <Link href={"/login" as any}>
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4 mr-2" />
          Login
        </Button>
      </Link>
    )
  }

  // Check if user is admin
  const isAdmin = (user as any).isAdmin === true
  
  // Debug: log user object
  console.log('User object:', user)
  console.log('isAdmin:', isAdmin)

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link href={"/admin/dashboard" as any}>
          <Button variant="ghost" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Admin
          </Button>
        </Link>
      )}
      <Link href={"/profile" as any}>
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4 mr-2" />
          {user.name}
        </Button>
      </Link>
      <Button variant="ghost" size="sm" onClick={logout}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
