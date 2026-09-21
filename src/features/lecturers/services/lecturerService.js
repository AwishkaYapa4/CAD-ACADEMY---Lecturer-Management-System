import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'

import { db } from '@/config/firebase'
import { COLLECTIONS } from '@/constants/collections'
import { ROLES } from '@/constants/roles'
import { provisionAccount } from '@/features/auth/services/provisionAccount'
import { createFirestoreService } from '@/services/firestoreService'

export const lecturersCollection = createFirestoreService(COLLECTIONS.LECTURERS)

/**
 * Creates the lecturer's Firebase Auth account (with the password Admin set
 * directly — see provisionAccount) plus the matching `lecturers/{lecturerId}`
 * and `users/{uid}` docs, linked both ways (`lecturerId`/`userId`), written
 * as one atomic batch so they can never end up out of sync.
 */
export async function createLecturer({ fullName, email, password }) {
  const uid = await provisionAccount(email, password)

  const batch = writeBatch(db)
  const lecturerRef = doc(lecturersCollection.colRef())
  const lecturerId = lecturerRef.id

  batch.set(lecturerRef, {
    lecturerId,
    userId: uid,
    fullName,
    email,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  batch.set(doc(db, COLLECTIONS.USERS, uid), {
    uid,
    fullName,
    email,
    role: ROLES.LECTURER,
    active: true,
    lecturerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
  return { uid, lecturerId }
}

/** `lecturer` is the full row from useLecturers()/useLecturer() — needs both `.id` (lecturerId) and `.userId`. */
export async function updateLecturer(lecturer, { fullName }) {
  const batch = writeBatch(db)

  batch.update(doc(db, COLLECTIONS.LECTURERS, lecturer.id), {
    fullName,
    updatedAt: serverTimestamp(),
  })

  batch.update(doc(db, COLLECTIONS.USERS, lecturer.userId), {
    fullName,
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
}

export async function setLecturerStatus(lecturer, active) {
  const batch = writeBatch(db)

  batch.update(doc(db, COLLECTIONS.LECTURERS, lecturer.id), {
    active,
    updatedAt: serverTimestamp(),
  })

  batch.update(doc(db, COLLECTIONS.USERS, lecturer.userId), {
    active,
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
}

export async function deleteLecturer(lecturer) {
  const batch = writeBatch(db)

  batch.delete(doc(db, COLLECTIONS.LECTURERS, lecturer.id))
  if (lecturer.userId) {
    batch.delete(doc(db, COLLECTIONS.USERS, lecturer.userId))
  }

  await batch.commit()
}
