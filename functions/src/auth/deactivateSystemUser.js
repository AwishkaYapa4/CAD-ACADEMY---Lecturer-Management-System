const { onCall, HttpsError } = require('firebase-functions/v2/https')

const { auth, db, FieldValue } = require('../utils/adminApp')
const { assertIsAdmin } = require('../utils/guards')
const { writeActivityLog } = require('../utils/activityLog')
const { requireString } = require('../utils/validation')

/**
 * Activates or deactivates a Staff/Lecturer account: disables sign-in at the
 * Auth layer (not just a Firestore flag, so a deactivated user is actually
 * locked out even if they still hold a valid session token) and flips
 * `active` on their users/{uid} doc (and lecturers/{lecturerId} if
 * applicable) in the same batch.
 */
exports.deactivateSystemUser = onCall(async (request) => {
  const caller = await assertIsAdmin(request)

  const data = request.data || {}
  const uid = requireString(data.uid, 'uid')
  const active = Boolean(data.active)

  if (uid === caller.uid) {
    throw new HttpsError('failed-precondition', 'You cannot deactivate your own account.')
  }

  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'User not found.')
  }
  const userData = userSnap.data()

  await auth.updateUser(uid, { disabled: !active })

  const batch = db.batch()
  batch.update(userRef, { active, updatedAt: FieldValue.serverTimestamp() })

  if (userData.role === 'lecturer' && userData.lecturerId) {
    batch.update(db.collection('lecturers').doc(userData.lecturerId), {
      active,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  await batch.commit()

  await writeActivityLog(caller, {
    action: active ? 'user_activated' : 'user_deactivated',
    entityType: userData.role,
    entityId: uid,
    summary: `${active ? 'reactivated' : 'deactivated'} ${userData.fullName}'s account`,
  }).catch(() => {})

  return { uid, active }
})
