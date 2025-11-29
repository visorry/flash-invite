"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav"
import { useRequireAuth } from "@/hooks/use-require-auth"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require authentication for all admin pages
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
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="sm:ml-64 pb-20 sm:pb-0">
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
      <AdminBottomNav />
    </div>
  )
}
