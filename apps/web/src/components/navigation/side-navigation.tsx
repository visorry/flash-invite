"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Bot, Link as LinkIcon, Coins, User, Zap, Shield, LogOut, Users, Cpu, Forward, UserCheck, LayoutDashboard, BookOpen, Download, Radio, ChevronDown } from "lucide-react"
import { useSession } from "@/hooks/use-session"
import { Button } from "@/components/ui/button"

export function SideNavigation() {
  const pathname = usePathname()
  const { user } = useSession()
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Main", "Bots & Groups", "Automation", "Account"])

  const navGroups = [
    {
      label: "Main",
      links: [
        { to: "/", label: "Home", icon: Home },
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/dashboard/tutorial", label: "Tutorial", icon: BookOpen },
      ],
    },
    {
      label: "Bots & Groups",
      links: [
        { to: "/dashboard/bots", label: "My Bots", icon: Cpu },
        { to: "/dashboard/groups", label: "Groups", icon: Bot },
        { to: "/dashboard/members", label: "Members", icon: Users },
      ],
    },
    {
      label: "Automation",
      links: [
        { to: "/dashboard/invites", label: "Invites", icon: LinkIcon },
        { to: "/dashboard/forward-rules", label: "Forwarding", icon: Forward },
        { to: "/dashboard/auto-drop", label: "Auto Drop", icon: Download },
        { to: "/dashboard/auto-approval", label: "Auto Approval", icon: UserCheck },
        { to: "/dashboard/broadcast", label: "Broadcast", icon: Radio },
      ],
    },
    {
      label: "Account",
      links: [
        { to: "/dashboard/tokens", label: "Tokens", icon: Coins },
        { to: "/dashboard/subscription", label: "Subscription", icon: Zap },
        { to: "/dashboard/profile", label: "Profile", icon: User },
      ],
    },
  ]


  const isAdmin = (user as any)?.isAdmin === true

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    )
  }

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0 hidden sm:block">
      <div className="h-full px-3 py-4 bg-background border-r flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6 px-3 shrink-0">
          <Image
            src="/favicon/icon-96x96.png"
            alt="Flash Invite Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-semibold text-lg">Flash Invite</span>
        </div>

        {/* Navigation Links - Scrollable */}
        <div className="flex-1 overflow-hidden relative">
          <nav className="space-y-2 h-full overflow-y-auto scrollbar-hide pb-4">
            {navGroups.map((group) => {
              const isExpanded = expandedGroups.includes(group.label)
              return (
                <div key={group.label}>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                  >
                    {group.label}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  </button>
                  {isExpanded && (
                    <div className="space-y-1 mt-1">
                      {group.links.map(({ to, label, icon: Icon }) => {
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
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        </div>

        {/* User Menu & Theme Toggle */}
        <div className="space-y-2 border-t pt-4 mt-4 shrink-0">
          {isAdmin && (
            <Link
              href={"/admin/dashboard" as any}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Shield className="h-5 w-5" />
              <span>Admin Panel</span>
            </Link>
          )}

        </div>
      </div>
    </aside>
  )
}
