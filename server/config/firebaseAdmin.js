import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

import { env } from './env.js'

// This server runs outside GCP (see server/README.md for why — the project's
// standing "no Cloud Functions / Spark plan only" rule, see project memory),
// so there's no ambient Application Default Credentials the way
// functions/src/utils/adminApp.js gets for free. A service-account cert does
// the same job: the Admin SDK bypasses firestore.rules entirely, which is
// what makes this the real security boundary for every route behind
// authenticate() — mirrors functions/src/utils/guards.js's assertIsAdmin().
const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
    })

export const db = getFirestore(app)
export const auth = getAuth(app)
export { FieldValue }
