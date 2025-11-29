"use client"

import { BottomNavigation } from "@/components/navigation/bottom-navigation"
import { SideNavigation } from "@/components/navigation/side-navigation"
import { TopNavigation } from "@/components/navigation/top-navigation"
import { useRequireAuth } from "@/hooks/use-require-auth"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require authentication for all dashboard pages
  const { isLoading } = useRequireAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <SideNavigation />
      <div className="sm:ml-64">
        <TopNavigation />
        <main>
          {children}
        </main>
      </div>
      <BottomNavigation />
    </div>
  )
}
