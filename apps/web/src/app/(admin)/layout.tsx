import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
