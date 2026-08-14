import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId']
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key])
if (missingKeys.length > 0) {
  console.error(
    `Firebase config is missing: ${missingKeys.join(', ')}. Copy .env.example to .env and fill in your Firebase project credentials.`
  )
}

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)

// Offline persistence keeps class schedules/reports usable on flaky connections.
// autoDetectLongPolling: some networks (school/office wifi, mobile carriers, proxies)
// silently break Firestore's streaming connection — writes still succeed, but
// onSnapshot listeners stop receiving updates until the page is reloaded and a
// fresh connection is made. Long-polling avoids that class of network entirely,
// and this option only switches to it when the streaming transport is detected
// to be broken, so it's a no-op on networks that already work fine.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
  experimentalAutoDetectLongPolling: true,
})

export const storage = getStorage(app)
