"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Bot, Link as LinkIcon, Users, User } from "lucide-react"

export function BottomNavigation() {
  const pathname = usePathname()

  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/groups", label: "Groups", icon: Bot },
    { to: "/invites", label: "Invites", icon: LinkIcon },
    { to: "/members", label: "Members", icon: Users },
    { to: "/profile", label: "Profile", icon: User },
  ] as const

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t sm:hidden">
      <nav className="flex items-center justify-around h-16">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to || (to !== "/" && pathname.startsWith(to))
          return (
            <Link
              key={to}
              href={to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
