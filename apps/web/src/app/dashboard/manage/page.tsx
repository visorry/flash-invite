"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Bot, Link as LinkIcon, Users, Cpu, BookOpen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function ManagePage() {
  const pathname = usePathname()

  const links = [
    {
      to: "/dashboard/tutorial",
      label: "Tutorial & Guide",
      icon: BookOpen,
      description: "Learn how to use FlashInvite step by step"
    },
    {
      to: "/dashboard/bots",
      label: "My Bots",
      icon: Cpu,
      description: "Add and manage your Telegram bots"
    },
    {
      to: "/dashboard/groups",
      label: "Groups",
      icon: Bot,
      description: "View groups and channels your bots are in"
    },
    {
      to: "/dashboard/invites",
      label: "Invites",
      icon: LinkIcon,
      description: "Create and track invite links"
    },
    {
      to: "/dashboard/members",
      label: "Members",
      icon: Users,
      description: "View and manage group members"
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-4">
      <div>
        <h1 className="text-lg font-semibold">Manage</h1>
        <p className="text-xs text-muted-foreground">
          Manage your bots, groups, and members
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
