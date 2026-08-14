const { onCall, HttpsError } = require('firebase-functions/v2/https')

const { db, FieldValue } = require('../utils/adminApp')
const { assertIsAdmin } = require('../utils/guards')
const { writeActivityLog } = require('../utils/activityLog')
const { requireString, optionalString } = require('../utils/validation')

/**
 * Updates a Staff or Lecturer's profile fields. Email and role are
 * intentionally not editable here — changing either is an identity change,
 * not a profile edit, and isn't exposed by this function.
 */
exports.updateSystemUser = onCall(async (request) => {
  const caller = await assertIsAdmin(request)

  const data = request.data || {}
  const uid = requireString(data.uid, 'uid')
  const fullName = requireString(data.fullName, 'Full name', { minLength: 2, maxLength: 200 })
  const phone = optionalString(data.phone, { maxLength: 40 })

  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'User not found.')
  }
  const userData = userSnap.data()

  const batch = db.batch()
  batch.update(userRef, {
    fullName,
    phone,
    updatedAt: FieldValue.serverTimestamp(),
  })

  if (userData.role === 'lecturer' && userData.lecturerId) {
    batch.update(db.collection('lecturers').doc(userData.lecturerId), {
      fullName,
      phone,
      employeeNumber: optionalString(data.employeeNumber, { maxLength: 60 }),
      nic: optionalString(data.nic, { maxLength: 60 }),
      qualification: optionalString(data.qualification, { maxLength: 300 }),
      address: optionalString(data.address, { maxLength: 500 }),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  await batch.commit()

  await writeActivityLog(caller, {
    action: 'user_updated',
    entityType: userData.role,
    entityId: uid,
    summary: `updated ${fullName}'s profile`,
  }).catch(() => {})

  return { uid }
})
