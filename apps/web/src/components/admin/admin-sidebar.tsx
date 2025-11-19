"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Bot, Link as LinkIcon, Settings, Home, DollarSign, ArrowLeft, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "@/hooks/use-session"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/admin/dashboard", label: "Overview", icon: <Home className="h-5 w-5" /> },
  { href: "/admin/users", label: "Users", icon: <Users className="h-5 w-5" /> },
  { href: "/admin/groups", label: "Groups", icon: <Bot className="h-5 w-5" /> },
  { href: "/admin/invites", label: "Invites", icon: <LinkIcon className="h-5 w-5" /> },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: <DollarSign className="h-5 w-5" /> },
  { href: "/admin/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, logout } = useSession()

  return (
    <nav className="fixed left-0 top-0 bottom-0 z-40 w-64 bg-background border-r border-border hidden sm:flex flex-col">
      <div className="flex items-center justify-between h-16 px-6 border-b border-border">
        <h2 className="text-lg font-semibold">Admin Dashboard</h2>
      </div>
      
      <div className="flex-1 py-4 flex flex-col">
        <div className="flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
                            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href as any}
                className={cn(
                  "flex items-center gap-3 mx-3 mb-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border p-3 space-y-2">
          {/* Back to Dashboard */}
          <Link
            href={"/" as any}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>

          {/* User Info */}
          {user && (
            <div className="px-3 py-2">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}

          {/* Logout */}
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
    </nav>
  )
}
