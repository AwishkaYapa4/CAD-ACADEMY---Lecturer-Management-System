const { onCall, HttpsError } = require('firebase-functions/v2/https')

const { auth, db, FieldValue } = require('../utils/adminApp')
const { assertIsAdmin } = require('../utils/guards')
const { writeActivityLog } = require('../utils/activityLog')
const {
  requireEmail,
  requirePassword,
  requireString,
  optionalString,
} = require('../utils/validation')

const ALLOWED_ROLES = ['staff', 'lecturer']

/**
 * Creates a Firebase Auth account for a new Staff or Lecturer user, plus the
 * matching Firestore doc(s) — the only place a `users/{uid}` doc gets
 * created, since firestore.rules blocks that from every client (see
 * firestore.rules `users` match). Runs as a single Firestore batch so the
 * users/lecturers docs can never end up out of sync with each other, and the
 * password is set by Admin directly (never returned or logged).
 */
exports.createSystemUser = onCall(async (request) => {
  const caller = await assertIsAdmin(request)

  const data = request.data || {}
  const role = data.role
  if (!ALLOWED_ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', 'Role must be staff or lecturer.')
  }

  const fullName = requireString(data.fullName, 'Full name', { minLength: 2, maxLength: 200 })
  const email = requireEmail(data.email)
  const password = requirePassword(data.password)
  const phone = optionalString(data.phone, { maxLength: 40 })

  // Lecturer-only profile fields.
  const employeeNumber = optionalString(data.employeeNumber, { maxLength: 60 })
  const nic = optionalString(data.nic, { maxLength: 60 })
  const qualification = optionalString(data.qualification, { maxLength: 300 })
  const address = optionalString(data.address, { maxLength: 500 })

  let userRecord
  try {
    userRecord = await auth.createUser({ email, password, displayName: fullName })
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'An account with this email already exists.')
    }
    throw new HttpsError('internal', 'Failed to create the account. Please try again.')
  }

  const batch = db.batch()
  const userRef = db.collection('users').doc(userRecord.uid)
  let lecturerId = null

  if (role === 'lecturer') {
    const lecturerRef = db.collection('lecturers').doc()
    lecturerId = lecturerRef.id
    batch.set(lecturerRef, {
      lecturerId,
      userId: userRecord.uid,
      fullName,
      email,
      phone,
      employeeNumber,
      nic,
      qualification,
      address,
      avatarUrl: '',
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: caller.uid,
    })
  }

  batch.set(userRef, {
    uid: userRecord.uid,
    fullName,
    email,
    phone,
    role,
    avatarUrl: '',
    active: true,
    lecturerId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: caller.uid,
  })

  try {
    await batch.commit()
  } catch (error) {
    // Firestore write failed after the Auth account was created — roll the
    // account back so we never leave an orphaned login with no profile.
    await auth.deleteUser(userRecord.uid).catch(() => {})
    throw new HttpsError('internal', 'Failed to save the new account. Please try again.')
  }

  await writeActivityLog(caller, {
    action: 'user_created',
    entityType: role,
    entityId: userRecord.uid,
    summary: `created a ${role} account for ${fullName}`,
  }).catch(() => {})

  return { uid: userRecord.uid, lecturerId }
})
