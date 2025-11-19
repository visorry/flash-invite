import { BottomNavigation } from "@/components/navigation/bottom-navigation"
import { SideNavigation } from "@/components/navigation/side-navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ paddingBottom: '80px' }}>
      <SideNavigation />
      <div className="sm:ml-64">
        {children}
      </div>
      <BottomNavigation />
    </div>
  )
}
