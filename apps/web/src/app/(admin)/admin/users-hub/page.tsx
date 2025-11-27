"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, MessageCircle, Server } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function UsersHubPage() {
  const pathname = usePathname()

  const links = [
    {
      to: "/admin/users",
      label: "Users",
      icon: Users,
      description: "Manage registered app users"
    },
    {
      to: "/admin/bot",
      label: "Bot Users",
      icon: MessageCircle,
      description: "View Telegram bot interactions"
    },
    {
      to: "/admin/bots",
      label: "Bots",
      icon: Server,
      description: "Manage and monitor Telegram bots"
    },
  ]

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Users</h1>
        <p className="text-xs text-muted-foreground">
          Manage users and bot interactions
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {links.map(({ to, label, icon: Icon, description }) => {
          const isActive = pathname.startsWith(to)
          return (
            <Link key={to} href={to}>
              <Card className={cn(
                "transition-all hover:bg-muted/50",
                isActive && "border-primary bg-primary/5"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      isActive ? "bg-primary/10 text-primary" : "bg-muted"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{label}</h3>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
