"use client"

import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { User, LogOut } from 'lucide-react'
import Link from 'next/link'

export function UserMenu() {
  const { user, logout } = useSession()

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4 mr-2" />
          Login
        </Button>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/profile">
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
