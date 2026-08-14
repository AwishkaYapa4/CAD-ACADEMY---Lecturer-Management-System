import { formatDistanceToNow } from 'date-fns'
import { Bell } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { useMarkNotificationRead, useMyNotifications } from '@/features/notifications/hooks/useNotifications'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { toDate } from '@/utils/formatters'

/** Shared across all three roles — a notification always belongs to exactly one user. */
export default function NotificationsPage() {
  const { firebaseUser } = useAuth()
  const { data: notifications, loading } = useMyNotifications(firebaseUser?.uid)
  const markRead = useMarkNotificationRead()

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Updates relevant to your account." />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="You're all caught up." />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const date = toDate(notification.createdAt)
            return (
              <Card
                key={notification.id}
                className={cn('cursor-pointer', !notification.read && 'bg-primary/5')}
                onClick={() => !notification.read && markRead.mutate(notification.id)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  {!notification.read ? (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  ) : (
                    <span className="mt-1.5 size-2 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    {date ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(date, { addSuffix: true })}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
