import { InvitesList } from '@/components/invites/invites-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function InvitesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invites</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your invite links
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Invite
        </Button>
      </div>

      <InvitesList />
    </div>
  )
}
