const { db, FieldValue } = require('./adminApp')

/**
 * Server-side counterpart to the client's logActivity() — same activityLogs
 * schema, written with the Admin SDK so it bypasses Firestore rules (client
 * rules only allow a caller to log their own actorUid; Cloud Functions log
 * on behalf of the admin who triggered them, which is already `actor`).
 */
async function writeActivityLog(actor, { action, entityType, entityId, summary }) {
  await db.collection('activityLogs').add({
    actorUid: actor.uid,
    actorName: actor.fullName ?? actor.email,
    actorRole: actor.role,
    action,
    entityType,
    entityId,
    summary,
    createdAt: FieldValue.serverTimestamp(),
  })
}

module.exports = { writeActivityLog }
