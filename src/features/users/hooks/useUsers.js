import { useMutation } from '@tanstack/react-query'

import { useFirestoreCollection } from '@/hooks/useFirestoreCollection'
import {
  USER_ORDER,
  createStaffUser,
  setUserActive,
  usersCollection,
} from '@/features/users/services/userService'

export function useUsers() {
  return useFirestoreCollection(usersCollection.subscribe, USER_ORDER, [])
}

export function useCreateStaffUser() {
  return useMutation({ mutationFn: createStaffUser })
}

export function useSetUserActive() {
  return useMutation({
    mutationFn: ({ uid, active }) => setUserActive(uid, active),
  })
}
