import { doc, serverTimestamp, setDoc } from 'firebase/firestore'

import { db } from '@/config/firebase'
import { COLLECTIONS } from '@/constants/collections'
import { ROLES } from '@/constants/roles'
import { provisionAccount } from '@/features/auth/services/provisionAccount'
import { createFirestoreService, orderBy } from '@/services/firestoreService'

export const usersCollection = createFirestoreService(COLLECTIONS.USERS)

export const USER_ORDER = [orderBy('fullName', 'asc')]

/** Staff accounts have no linked lecturers doc — just a users/{uid} record. */
export async function createStaffUser({ fullName, email, password }) {
  const uid = await provisionAccount(email, password)

  await setDoc(doc(db, COLLECTIONS.USERS, uid), {
    uid,
    fullName,
    email,
    role: ROLES.STAFF,
    active: true,
    lecturerId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return uid
}

export async function updateUserName(uid, fullName) {
  await usersCollection.update(uid, { fullName })
}

export async function setUserActive(uid, active) {
  await usersCollection.update(uid, { active })
}
