import { Bell } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { EmptyState } from '@/components/common/EmptyState'

/**
 * Shell for the realtime notifications bell. Wired to the `notifications`
 * Firestore collection in the Notifications module; for now it renders the
 * trigger + empty state so the navbar layout is complete.
 */
export function NotificationsBell() {
  const unreadCount = 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <span className="absolute top-1 right-1 flex size-2 rounded-full bg-destructive" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
        </div>
        <div className="p-2">
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="You'll see class, report, and payment updates here."
            className="border-none bg-transparent py-8"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
