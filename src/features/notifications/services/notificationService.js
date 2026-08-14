import { updateDoc } from 'firebase/firestore'

import { COLLECTIONS } from '@/constants/collections'
import { createFirestoreService, orderBy, where } from '@/services/firestoreService'

export const notificationsCollection = createFirestoreService(COLLECTIONS.NOTIFICATIONS)

export function userNotificationConstraints(userId) {
  return [where('userId', '==', userId), orderBy('createdAt', 'desc')]
}

export async function createNotification({ userId, role, type, title, message, relatedId }) {
  return notificationsCollection.create({
    userId,
    role,
    type,
    title,
    message,
    relatedId: relatedId ?? null,
    read: false,
  })
}

// Direct call (not the generic .update() helper) because that helper always
// stamps `updatedAt`, which would violate the rule's onlyAffects(['read']) —
// notifications intentionally have no updatedAt field.
export async function markNotificationRead(notificationId) {
  await updateDoc(notificationsCollection.docRef(notificationId), { read: true })
}
