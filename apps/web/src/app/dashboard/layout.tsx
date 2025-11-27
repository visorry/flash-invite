import { BottomNavigation } from "@/components/navigation/bottom-navigation"
import { SideNavigation } from "@/components/navigation/side-navigation"
import { TopNavigation } from "@/components/navigation/top-navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
