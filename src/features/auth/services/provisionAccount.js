import { deleteApp, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth'

import { app as primaryApp } from '@/config/firebase'

/**
 * Creates a Firebase Auth account for a new Staff/Lecturer without disturbing
 * the currently signed-in admin. `createUserWithEmailAndPassword` on the
 * primary app would sign the browser in as the new user, kicking the admin
 * out — so this spins up a throwaway secondary app instance (same project,
 * isolated session) purely for the create call, then tears it down.
 *
 * No Cloud Functions in this project (client-only, by choice — avoids the
 * Blaze billing plan), so this is the account-creation boundary: Admin sets
 * the password directly here, and it's returned to nobody — the caller only
 * gets the new uid back.
 */
export async function provisionAccount(email, password) {
  const secondaryApp = initializeApp(primaryApp.options, `provision-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    return credential.user.uid
  } finally {
    await signOut(secondaryAuth).catch(() => {})
    await deleteApp(secondaryApp).catch(() => {})
  }
}
