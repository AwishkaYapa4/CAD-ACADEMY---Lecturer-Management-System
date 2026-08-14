import { doc, serverTimestamp, setDoc } from 'firebase/firestore'

import { db } from '@/config/firebase'
import { COLLECTIONS } from '@/constants/collections'
import { createFirestoreService } from '@/services/firestoreService'

export const settingsCollection = createFirestoreService(COLLECTIONS.SYSTEM_SETTINGS)

export const GENERAL_SETTINGS_DOC_ID = 'general'

export async function saveGeneralSettings({ academyName, supportEmail, defaultCurrency }) {
  await setDoc(
    doc(db, COLLECTIONS.SYSTEM_SETTINGS, GENERAL_SETTINGS_DOC_ID),
    {
      academyName,
      supportEmail: supportEmail || '',
      defaultCurrency: defaultCurrency || 'USD',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}
