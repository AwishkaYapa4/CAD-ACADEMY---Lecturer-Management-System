import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { deleteObject, ref } from 'firebase/storage'

import { db, storage } from '@/config/firebase'
import { COLLECTIONS } from '@/constants/collections'
import { SCHEDULE_STATUS } from '@/constants/statuses'
import { createFirestoreService, orderBy, where } from '@/services/firestoreService'

export const schedulesCollection = createFirestoreService(COLLECTIONS.CLASS_SCHEDULES)

export const SCHEDULE_ORDER = [orderBy('classDate', 'desc')]

export function lecturerScheduleConstraints(lecturerId) {
  return [where('lecturerId', '==', lecturerId), orderBy('classDate', 'desc')]
}

export function batchScheduleConstraints(batchId) {
  return [where('batchId', '==', batchId), orderBy('classDate', 'desc')]
}

/**
 * Deterministic id (same trick as classReports' doc-id-is-scheduleId) so a
 * duplicate class for the same lecturer/course/batch/date/time collides at
 * the Firestore doc level instead of silently creating a second row. A
 * colliding lecturer write is rejected by firestore.rules (a create against
 * an existing doc id is evaluated as an update, and the lecturer update rule
 * only allows touching status/reportId/completedAt/updatedAt) — that's the
 * real enforcement. The getDoc check below only exists to surface a friendly
 * error instead of a raw permission-denied when we can.
 */
export function buildScheduleId({ lecturerId, courseId, batchId, classDate, startTime }) {
  return `${lecturerId}__${courseId}__${batchId}__${classDate}__${startTime}`
}

/**
 * Firestore denies a `get()` on a document that doesn't exist yet whenever
 * the read rule depends on `resource.data` (ownsLecturerId(resource.data...)
 * errors because `resource` is null) — so for the common case of a brand
 * new class, this read itself throws permission-denied even though there's
 * no actual duplicate. Treat any read failure here as "can't confirm, so
 * assume no duplicate" and let the write's own rules be the real guard.
 */
async function scheduleExists(scheduleRef) {
  try {
    const snapshot = await getDoc(scheduleRef)
    return snapshot.exists()
  } catch {
    return false
  }
}

export async function createSchedule({ batchId, courseId, lecturerId, classDate, startTime, endTime, locationType, location, zoomLink }) {
  const scheduleId = buildScheduleId({ lecturerId, courseId, batchId, classDate, startTime })
  const scheduleRef = doc(db, COLLECTIONS.CLASS_SCHEDULES, scheduleId)

  if (await scheduleExists(scheduleRef)) {
    throw new Error('A class already exists for this lecturer, batch, and course at this date and time.')
  }

  await setDoc(scheduleRef, {
    batchId,
    courseId,
    lecturerId,
    classDate: new Date(classDate),
    startTime,
    endTime,
    locationType,
    location: location || '',
    zoomLink: zoomLink || '',
    status: SCHEDULE_STATUS.SCHEDULED,
    reportId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return scheduleId
}

export async function updateSchedule(scheduleId, { classDate, startTime, endTime, locationType, location, zoomLink }) {
  await schedulesCollection.update(scheduleId, {
    classDate: new Date(classDate),
    startTime,
    endTime,
    locationType,
    location: location || '',
    zoomLink: zoomLink || '',
  })
}

export async function cancelSchedule(scheduleId) {
  await schedulesCollection.update(scheduleId, { status: SCHEDULE_STATUS.CANCELLED })
}

/**
 * Deletes a class regardless of status. If a report and/or materials were
 * already submitted for it, this cascades: every material's Storage file is
 * removed (best-effort — a failure there doesn't block the rest, matching
 * deleteMaterial()'s own behavior), then the classMaterials docs, the
 * classReports doc, and the classSchedules doc are all deleted together in
 * one atomic batch, so nothing is ever left half-deleted or dangling.
 *
 * Blocked once the report has been marked paid (checked here for a friendly
 * error, and enforced for real by firestore.rules) — that history has to
 * stay permanent, so the class it belongs to can't be deleted either.
 *
 * `lecturerId` is required on the materials lookup even though `scheduleId`
 * alone would already narrow it to the right docs in practice: firestore.rules'
 * classMaterials read rule depends on resource.data.lecturerId, and Firestore
 * rejects a whole list query outright (not per-doc) whenever it can't prove
 * every possible result satisfies the rule from the query's own `where`
 * clauses alone — it has no way to know every material for this schedule
 * happens to belong to this lecturer without a matching filter to check that
 * against. This mirrors lecturerMaterialConstraints() elsewhere in the app.
 */
export async function deleteScheduleCascade(scheduleId, lecturerId) {
  const reportRef = doc(db, COLLECTIONS.CLASS_REPORTS, scheduleId)
  const reportSnap = await getDoc(reportRef).catch(() => null)
  if (reportSnap?.exists() && reportSnap.data().paymentProcessed) {
    throw new Error('This class has already been paid for and can no longer be deleted.')
  }

  const materialsSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.CLASS_MATERIALS),
      where('scheduleId', '==', scheduleId),
      where('lecturerId', '==', lecturerId)
    )
  )

  await Promise.all(
    materialsSnap.docs.map((materialDoc) =>
      deleteObject(ref(storage, materialDoc.data().storagePath)).catch(() => {})
    )
  )

  const batch = writeBatch(db)
  materialsSnap.docs.forEach((materialDoc) => batch.delete(materialDoc.ref))
  if (reportSnap?.exists()) batch.delete(reportRef)
  batch.delete(doc(db, COLLECTIONS.CLASS_SCHEDULES, scheduleId))
  await batch.commit()
}
