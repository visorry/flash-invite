"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  Home,
  ArrowLeft,
  Settings,
  FolderOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { to: "/admin/dashboard", label: "Home", icon: Home },
  { to: "/admin/users-hub", label: "Users", icon: Users, matches: ["/admin/users", "/admin/bot"] },
  { to: "/admin/content", label: "Content", icon: FolderOpen, matches: ["/admin/groups", "/admin/invites", "/admin/broadcast"] },
  { to: "/admin/settings", label: "Settings", icon: Settings, matches: ["/admin/subscriptions"] },
  { to: "/", label: "Exit", icon: ArrowLeft },
] as const

export function AdminBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-2 right-2 z-50 bg-background border border-border rounded-t-2xl sm:hidden pb-[env(safe-area-inset-bottom)] shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(({ to, label, icon: Icon, ...rest }) => {
          const matches = 'matches' in rest ? rest.matches : []
          const isActive = pathname === to ||
                          pathname.startsWith(to + "/") ||
                          matches.some(m => pathname.startsWith(m))

          return (
            <Link
              key={to}
              href={to as any}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors relative px-2 py-1 rounded-lg",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1 leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
