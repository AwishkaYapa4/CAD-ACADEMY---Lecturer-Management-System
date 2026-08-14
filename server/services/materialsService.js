import { db, FieldValue } from '../config/firebaseAdmin.js'

// Own collection rather than reusing classMaterials — that collection's
// shape (scheduleId/reportId, tied to one class report) is a different
// concept from a course-wide, week-organized material library. Deliberately
// NOT in src/constants/collections.js: this collection is only ever read/
// written through this API (Admin SDK), never directly by the Firestore
// client SDK, so it isn't part of firestore.rules and doesn't need a shared
// frontend constant — see src/types/entities.js's CourseMaterialDoc comment.
const COLLECTION = 'courseMaterials'

export async function createMaterial(data) {
  const ref = db.collection(COLLECTION).doc()
  await ref.set({ ...data, uploadedAt: FieldValue.serverTimestamp() })
  const snap = await ref.get()
  return { id: snap.id, ...snap.data() }
}

export async function getMaterialById(id) {
  const snap = await db.collection(COLLECTION).doc(id).get()
  if (!snap.exists) return null
  return { id: snap.id, ...snap.data() }
}

/**
 * Sorted in-memory (week asc, then newest-first within a week) rather than
 * via Firestore orderBy, so listing never needs a composite index for
 * courseId + week + uploadedAt.
 */
export async function listMaterialsByCourse(courseId) {
  const snap = await db.collection(COLLECTION).where('courseId', '==', courseId).get()
  const materials = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  materials.sort((a, b) => {
    if (a.week !== b.week) return a.week - b.week
    return (b.uploadedAt?.toMillis?.() ?? 0) - (a.uploadedAt?.toMillis?.() ?? 0)
  })
  return materials
}

/**
 * Sorted in-memory, newest first — same reasoning as listMaterialsByCourse
 * (avoids needing a composite index for uploadedBy + uploadedAt).
 */
export async function listMaterialsByUploader(uid) {
  const snap = await db.collection(COLLECTION).where('uploadedBy', '==', uid).get()
  const materials = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  materials.sort((a, b) => (b.uploadedAt?.toMillis?.() ?? 0) - (a.uploadedAt?.toMillis?.() ?? 0))
  return materials
}

export async function deleteMaterial(id) {
  await db.collection(COLLECTION).doc(id).delete()
}

/**
 * Keeps classReports/{scheduleId}.materialCount in sync when a material is
 * uploaded/removed via the "Complete Class" flow (SubmitReportPage passes
 * its scheduleId through on upload — see materials.controller.js). Best-
 * effort and never fatal: the report doc might not exist (draft not saved
 * yet) or might already be gone, and neither should ever fail the material
 * upload/delete itself, since materialCount is a display cache, not the
 * source of truth for anything else (see project memory).
 */
export async function adjustReportMaterialCount(scheduleId, delta) {
  if (!scheduleId) return
  try {
    await db
      .collection('classReports')
      .doc(scheduleId)
      .update({ materialCount: FieldValue.increment(delta), updatedAt: FieldValue.serverTimestamp() })
  } catch (error) {
    console.error('[materials-api] Failed to adjust classReports.materialCount', scheduleId, error)
  }
}
