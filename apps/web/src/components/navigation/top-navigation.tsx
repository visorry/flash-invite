"use client"

import Link from "next/link"
import { Coins, User, LogOut, Feather } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "../mode-toggle"
import { useSession } from "@/hooks/use-session"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function TopNavigation() {
  const { user, logout } = useSession()

  // Fetch token balance
  const { data: balance } = useQuery({
    queryKey: ['tokens', 'balance'],
    queryFn: async () => {
      return api.tokens.getBalance()
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo - visible on mobile */}
        <div className="flex items-center gap-2 sm:hidden">
          <Feather className="h-6 w-6 text-amber-500 fill-amber-500/40" />
        </div>

        {/* Empty space for desktop (logo is in sidebar) */}
        <div className="hidden sm:block" />

        {/* Right side - Token balance and avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Token Balance */}
          <Link href="/tokens">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 px-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/20"
            >
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {((balance as any)?.balance || 0).toLocaleString()}
              </span>
            </Button>
          </Link>

          {/* Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full p-0">
                <div className="h-8 w-8 rounded-full ring-2 ring-amber-500/50 ring-offset-2 ring-offset-background">
                  <Avatar className="h-full w-full">
                    <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user && (
                <>
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-sm">Theme</span>
                <ModeToggle />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
