"use client"

import Link from "next/link"
import { Coins, Menu } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "../mode-toggle"

export function TopNavigation() {
  // Fetch token balance
  const { data: balance } = useQuery({
    queryKey: ['tokens', 'balance'],
    queryFn: async () => {
      return api.tokens.getBalance()
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo - visible on mobile */}
        <div className="flex items-center gap-2 sm:hidden">
          <span className="font-semibold text-lg">Super Invite</span>
        </div>

        {/* Empty space for desktop (logo is in sidebar) */}
        <div className="hidden sm:block" />

        {/* Right side - Token balance and theme toggle */}
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

          {/* Theme Toggle - hidden on mobile, shown in bottom nav */}
          <div className="hidden sm:block">
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
