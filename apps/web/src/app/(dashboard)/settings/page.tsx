import { Card } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account settings
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Settings page coming soon...
        </p>
      </Card>
    </div>
  )
}
