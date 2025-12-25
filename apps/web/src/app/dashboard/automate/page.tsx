"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Forward, UserCheck, ArrowDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function AutomatePage() {
  const pathname = usePathname()

  const links = [
    {
      to: "/dashboard/forward-rules",
      label: "Forwarding",
      icon: Forward,
      description: "Auto-forward messages between channels"
    },
    {
      to: "/dashboard/auto-approval",
      label: "Auto Approval",
      icon: UserCheck,
      description: "Automatically approve join requests"
    },
    {
      to: "/dashboard/auto-drop",
      label: "Auto Drop",
      icon: ArrowDown,
      description: "Send posts from groups to bot users"
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-4">
      <div>
        <h1 className="text-lg font-semibold">Automate</h1>
        <p className="text-xs text-muted-foreground">
          Set up automation rules for your bots
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
