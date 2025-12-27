"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Bot, Link as LinkIcon, Coins, User, Zap, Shield, LogOut, Users, Cpu, Forward, UserCheck, LayoutDashboard, BookOpen, Download, Radio } from "lucide-react"
import { ModeToggle } from "../mode-toggle"
import { useSession } from "@/hooks/use-session"
import { Button } from "@/components/ui/button"

export function SideNavigation() {
  const pathname = usePathname()
  const { user, logout } = useSession()

  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/tutorial", label: "Tutorial", icon: BookOpen },
    { to: "/dashboard/bots", label: "My Bots", icon: Cpu },
    { to: "/dashboard/groups", label: "Groups", icon: Bot },
    { to: "/dashboard/invites", label: "Invites", icon: LinkIcon },
    { to: "/dashboard/forward-rules", label: "Forwarding", icon: Forward },
    { to: "/dashboard/auto-drop", label: "Auto Drop", icon: Download },
    { to: "/dashboard/auto-approval", label: "Auto Approval", icon: UserCheck },
    { to: "/dashboard/broadcast", label: "Broadcast", icon: Radio },
    { to: "/dashboard/members", label: "Members", icon: Users },
    { to: "/dashboard/tokens", label: "Tokens", icon: Coins },
    { to: "/dashboard/subscription", label: "Subscription", icon: Zap },
    { to: "/dashboard/profile", label: "Profile", icon: User },
  ] as const


  const isAdmin = (user as any)?.isAdmin === true

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0 hidden sm:block">
      <div className="h-full px-3 py-4 overflow-y-auto bg-background border-r flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6 px-3">
          <Image
            src="/favicon/icon-96x96.png"
            alt="Flash Invite Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-semibold text-lg">Flash Invite</span>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = to === "/"
              ? pathname === "/"
              : pathname === to || (to !== "/dashboard" && to !== "/" && pathname.startsWith(to))
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
