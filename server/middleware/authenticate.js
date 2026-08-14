import { auth, db } from '../config/firebaseAdmin.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * Verifies the Firebase ID token on the Authorization: Bearer header and
 * loads the caller's users/{uid} doc with the Admin SDK (bypasses
 * firestore.rules) — mirrors assertIsAdmin() in
 * functions/src/utils/guards.js. This check IS the security boundary for
 * every route behind it; req.user is trusted everywhere downstream.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    throw new ApiError(401, 'You must be signed in.')
  }

  let decoded
  try {
    decoded = await auth.verifyIdToken(token)
  } catch {
    throw new ApiError(401, 'Your session has expired. Please sign in again.')
  }

  const userSnap = await db.collection('users').doc(decoded.uid).get()
  const userData = userSnap.data()
  if (!userSnap.exists || userData.active !== true) {
    throw new ApiError(403, 'This account is inactive or no longer exists.')
  }

  req.user = { uid: decoded.uid, ...userData }
  next()
})
