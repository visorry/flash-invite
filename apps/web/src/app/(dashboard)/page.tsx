import { StatsCard } from '@/components/dashboard/stats-card'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { Bot, Link, Users, Activity } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome to Super Invite - Manage your Telegram invites
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Bots"
          value="0"
          icon={Bot}
          description="Active bots"
        />
        <StatsCard
          title="Active Invites"
          value="0"
          icon={Link}
          description="Currently active"
        />
        <StatsCard
          title="Total Members"
          value="0"
          icon={Users}
          description="Joined via invites"
        />
        <StatsCard
          title="Activity"
          value="0"
          icon={Activity}
          description="Last 24 hours"
        />
      </div>

      <RecentActivity />
    </div>
  )
}
