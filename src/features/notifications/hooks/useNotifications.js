import { useMutation } from '@tanstack/react-query'

import { useFirestoreCollection } from '@/hooks/useFirestoreCollection'
import {
  markNotificationRead,
  notificationsCollection,
  userNotificationConstraints,
} from '@/features/notifications/services/notificationService'

export function useMyNotifications(userId) {
  return useFirestoreCollection(
    notificationsCollection.subscribe,
    userId ? userNotificationConstraints(userId) : [],
    [userId]
  )
}

export function useMarkNotificationRead() {
  return useMutation({ mutationFn: markNotificationRead })
}
