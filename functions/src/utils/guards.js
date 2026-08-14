const { HttpsError } = require('firebase-functions/v2/https')
const { db } = require('./adminApp')

/**
 * Verifies the caller is signed in and is an active Admin, by reading their
 * own users/{uid} doc with the Admin SDK (bypasses Firestore rules — this
 * check IS the security boundary for every callable in this project).
 * Returns the caller's user doc data on success.
 */
async function assertIsAdmin(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in.')
  }

  const callerSnap = await db.collection('users').doc(request.auth.uid).get()
  const callerData = callerSnap.data()

  if (!callerSnap.exists || callerData.role !== 'admin' || callerData.active !== true) {
    throw new HttpsError('permission-denied', 'Only an active Admin can perform this action.')
  }

  return { uid: request.auth.uid, ...callerData }
}

module.exports = { assertIsAdmin }
