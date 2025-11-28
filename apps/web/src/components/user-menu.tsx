"use client"

import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Shield, Home } from 'lucide-react'
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4 mr-2" />
          {user.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild className="sm:hidden">
          <Link href="/" className="flex items-center cursor-pointer">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="flex items-center cursor-pointer">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/dashboard" className="flex items-center cursor-pointer">
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
