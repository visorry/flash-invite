"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Bot, Link as LinkIcon, Home, ArrowLeft, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin/dashboard" as any, label: "Overview", icon: <Home className="h-5 w-5" /> },
  { href: "/admin/users" as any, label: "Users", icon: <Users className="h-5 w-5" /> },
  { href: "/admin/bot" as any, label: "Bot", icon: <MessageCircle className="h-5 w-5" /> },
  { href: "/admin/groups" as any, label: "Groups", icon: <Bot className="h-5 w-5" /> },
  { href: "/" as any, label: "Back", icon: <ArrowLeft className="h-5 w-5" /> },
]

export function AdminBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border sm:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
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
  )
}
