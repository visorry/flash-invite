"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Bot, Link as LinkIcon, Users } from "lucide-react"

export function BottomNavigation() {
  const pathname = usePathname()

  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/groups", label: "Groups", icon: Bot },
    { to: "/invites", label: "Invites", icon: LinkIcon },
    { to: "/members", label: "Members", icon: Users },
  ] as const

  return (
    <div className="fixed bottom-0 left-2 right-2 z-50 bg-primary dark:bg-background border border-primary-foreground/20 dark:border-border rounded-t-2xl sm:hidden shadow-lg pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-around h-16 px-2">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to || (to !== "/" && pathname.startsWith(to))
          return (
            <Link
              key={to}
              href={to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all relative",
                isActive
                  ? "text-primary-foreground dark:text-primary"
                  : "text-primary-foreground/60 dark:text-muted-foreground hover:text-primary-foreground/80 dark:hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-foreground dark:bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
