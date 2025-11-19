import { Card } from '@/components/ui/card'

export function BotsList() {
  return (
    <Card className="p-6">
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No bots configured yet. Click "Add Bot" to get started.
      </div>
    </Card>
  )
}
