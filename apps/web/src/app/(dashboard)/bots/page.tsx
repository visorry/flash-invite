import { BotsList } from '@/components/bots/bots-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function BotsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bots</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your Telegram bots
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Bot
        </Button>
      </div>

      <BotsList />
    </div>
  )
}
