"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Bot, Link as LinkIcon, Coins, User, Zap, Shield, LogOut, Users, Cpu, Forward, UserCheck } from "lucide-react"
import { ModeToggle } from "../mode-toggle"
import { useSession } from "@/hooks/use-session"
import { Button } from "@/components/ui/button"

export function SideNavigation() {
  const pathname = usePathname()
  const { user, logout } = useSession()

  const links = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/bots", label: "My Bots", icon: Cpu },
    { to: "/groups", label: "Groups", icon: Bot },
    { to: "/invites", label: "Invites", icon: LinkIcon },
    { to: "/forward-rules", label: "Forwarding", icon: Forward },
    { to: "/auto-approval", label: "Auto Approval", icon: UserCheck },
    { to: "/members", label: "Members", icon: Users },
    { to: "/tokens", label: "Tokens", icon: Coins },
    { to: "/subscription", label: "Subscription", icon: Zap },
    { to: "/profile", label: "Profile", icon: User },
  ] as const

  const isAdmin = (user as any)?.isAdmin === true

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0 hidden sm:block">
      <div className="h-full px-3 py-4 overflow-y-auto bg-background border-r flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6 px-3">
          <Bot className="h-6 w-6 text-primary" />
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Menu & Theme Toggle */}
        <div className="space-y-2 border-t pt-4 mt-4">
          {/* Admin Link */}
          {isAdmin && (
            <Link
              href={"/admin/dashboard" as any}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Shield className="h-5 w-5" />
              <span>Admin Panel</span>
            </Link>
          )}

          {/* User Info */}
          {user && (
            <div className="px-3 py-2">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}

          {/* Theme Toggle */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ModeToggle />
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={logout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </aside>
  )
}
