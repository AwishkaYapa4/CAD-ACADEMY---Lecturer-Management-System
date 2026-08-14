import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

import { auth, db } from '@/config/firebase'
import { COLLECTIONS } from '@/constants/collections'

/**
 * Authenticates with Firebase Auth. Role-based access is enforced separately by
 * reading the matching `users/{uid}` Firestore document (see getUserProfile).
 */
export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function signOutUser() {
  await signOut(auth)
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email)
}

export async function changePassword(newPassword) {
  if (!auth.currentUser) throw new Error('No authenticated user')
  await updatePassword(auth.currentUser, newPassword)
}

/**
 * The `users` collection is the single source of truth for role-based access.
 * Doc id === Firebase Auth uid.
 */
export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, COLLECTIONS.USERS, uid))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

export async function touchLastLogin(uid) {
  await setDoc(
    doc(db, COLLECTIONS.USERS, uid),
    { lastLoginAt: serverTimestamp() },
    { merge: true }
  )
}
