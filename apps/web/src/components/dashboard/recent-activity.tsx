import { Card } from '@/components/ui/card'

export function RecentActivity() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No recent activity
      </div>
    </Card>
  )
}
