"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  Bot,
  Link as LinkIcon,
  Home,
  ArrowLeft,
  MessageCircle,
  Send,
  DollarSign,
  Settings,
  Star,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

const primaryNavItems = [
  { href: "/admin/dashboard" as any, label: "Overview", icon: <Home className="h-5 w-5" /> },
  { href: "/admin/users" as any, label: "Users", icon: <Users className="h-5 w-5" /> },
]

const moreNavItems = [
  { href: "/admin/bot" as any, label: "Bot Users", icon: <MessageCircle className="h-5 w-5" /> },
  { href: "/admin/broadcast" as any, label: "Broadcast", icon: <Send className="h-5 w-5" /> },
  { href: "/admin/groups" as any, label: "Groups", icon: <Bot className="h-5 w-5" /> },
  { href: "/admin/invites" as any, label: "Invites", icon: <LinkIcon className="h-5 w-5" /> },
  { href: "/admin/subscriptions" as any, label: "Subscriptions", icon: <DollarSign className="h-5 w-5" /> },
  { href: "/admin/settings" as any, label: "Settings", icon: <Settings className="h-5 w-5" /> },
  { href: "/" as any, label: "Back to App", icon: <ArrowLeft className="h-5 w-5" /> },
]

const secondaryNavItems = [
  { href: "/admin/settings" as any, label: "Settings", icon: <Settings className="h-5 w-5" /> },
]

export function AdminBottomNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  // Check if current page is in the "more" menu
  const isMoreActive = moreNavItems.some(item =>
    pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
  )

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More Menu */}
      {showMore && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-background border border-border rounded-2xl shadow-lg sm:hidden pb-[env(safe-area-inset-bottom)]">
          <div className="p-2">
            <div className="grid grid-cols-3 gap-1">
              {moreNavItems.map((item) => {
                const isActive = pathname === item.href ||
                                (item.href !== "/" && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 text-xs font-medium transition-colors rounded-xl",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted"
                    )}
                  >
                    {item.icon}
                    <span className="mt-1.5 leading-none text-center">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-2 right-2 z-50 bg-background border border-border rounded-t-2xl sm:hidden pb-[env(safe-area-inset-bottom)] shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Primary nav items */}
          {primaryNavItems.map((item) => {
            const isActive = pathname === item.href ||
                            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors relative px-2 py-1 rounded-lg",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.icon}
                <span className="mt-1 leading-none">{item.label}</span>
              </Link>
            )
          })}

          {/* Central More Button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors relative px-2 py-1 rounded-lg",
              showMore || isMoreActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {showMore ? (
              <X className="h-5 w-5" />
            ) : (
              <Star className="h-5 w-5" />
            )}
            <span className="mt-1 leading-none">More</span>
          </button>

          {/* Secondary nav items */}
          {secondaryNavItems.map((item) => {
            const isActive = pathname === item.href ||
                            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors relative px-2 py-1 rounded-lg",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.icon}
                <span className="mt-1 leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
