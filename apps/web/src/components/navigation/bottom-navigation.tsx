"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Cpu, Link as LinkIcon, Users } from "lucide-react"

export function BottomNavigation() {
  const pathname = usePathname()

  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/bots", label: "Bots", icon: Cpu },
    { to: "/invites", label: "Invites", icon: LinkIcon },
    { to: "/members", label: "Members", icon: Users },
  ] as const

  return (
    <div className="fixed bottom-0 left-2 right-2 z-50 bg-[oklch(0.145_0_0)] border border-white/10 rounded-t-2xl sm:hidden shadow-lg pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-around h-16 px-2">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to || (to !== "/" && pathname.startsWith(to))
          return (
            <Link
              key={to}
              href={to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all",
                isActive
                  ? "text-primary"
                  : "text-white/60 hover:text-white/80"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
