"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Bot, Link as LinkIcon, Coins, User, Zap } from "lucide-react"
import { ModeToggle } from "../mode-toggle"

export function SideNavigation() {
  const pathname = usePathname()

  const links = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/groups", label: "Groups", icon: Bot },
    { to: "/invites", label: "Invites", icon: LinkIcon },
    { to: "/tokens", label: "Tokens", icon: Coins },
    { to: "/profile", label: "Profile", icon: User },
  ] as const

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0 hidden sm:block">
      <div className="h-full px-3 py-4 overflow-y-auto bg-background border-r">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6 px-3">
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Super Invite</span>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = pathname === to || (to !== "/" && pathname.startsWith(to))
            return (
              <Link
                key={to}
                href={to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="absolute bottom-4 left-3 right-3">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ModeToggle />
          </div>
        </div>
      </div>
    </aside>
  )
}
