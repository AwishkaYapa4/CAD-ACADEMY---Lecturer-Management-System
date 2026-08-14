import { doc, getDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'

import { db } from '@/config/firebase'
import { COLLECTIONS } from '@/constants/collections'
import { REPORT_STATUS, SCHEDULE_STATUS } from '@/constants/statuses'
import { createFirestoreService, orderBy, where } from '@/services/firestoreService'

// Doc id === scheduleId (one report per scheduled class) — see firestore.rules.
export const classReportsCollection = createFirestoreService(COLLECTIONS.CLASS_REPORTS)

export function lecturerReportConstraints(lecturerId) {
  return [where('lecturerId', '==', lecturerId), orderBy('createdAt', 'desc')]
}

export function batchReportConstraints(batchId) {
  return [where('batchId', '==', batchId), orderBy('createdAt', 'desc')]
}

/**
 * Firestore denies a `get()` on a document that doesn't exist yet whenever
 * the read rule depends on `resource.data` (ownsLecturerId(resource.data...)
 * errors because `resource` is null) — so for a lecturer's first-ever draft
 * on a class, this read throws permission-denied even though there's simply
 * no report yet. Treat any read failure as "no existing report."
 */
async function getExistingReport(scheduleId) {
  try {
    const snapshot = await getDoc(doc(db, COLLECTIONS.CLASS_REPORTS, scheduleId))
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
  } catch {
    return null
  }
}

/** Saves a class report as a draft. Does not complete the class. */
export async function saveReportDraft(scheduleId, { lecturerId, courseId, batchId, ...fields }) {
  const existing = await getExistingReport(scheduleId)
  const reportRef = doc(db, COLLECTIONS.CLASS_REPORTS, scheduleId)

  if (existing) {
    await updateDoc(reportRef, {
      ...fields,
      status: REPORT_STATUS.DRAFT,
      updatedAt: serverTimestamp(),
    })
    return
  }

  const batch = writeBatch(db)
  batch.set(reportRef, {
    scheduleId,
    lecturerId,
    courseId,
    batchId,
    ...fields,
    status: REPORT_STATUS.DRAFT,
    materialCount: 0,
    paymentProcessed: false,
    paymentId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.update(doc(db, COLLECTIONS.CLASS_SCHEDULES, scheduleId), {
    status: SCHEDULE_STATUS.DRAFT_REPORT,
    reportId: scheduleId,
    updatedAt: serverTimestamp(),
  })
  await batch.commit()
}

/**
 * Submits the report — this is what completes the class (no separate
 * verification step). Works whether or not a draft already exists.
 */
export async function submitReport(scheduleId, { lecturerId, courseId, batchId, ...fields }) {
  const existing = await getExistingReport(scheduleId)
  const reportRef = doc(db, COLLECTIONS.CLASS_REPORTS, scheduleId)
  const batch = writeBatch(db)

  if (existing) {
    batch.update(reportRef, {
      ...fields,
      status: REPORT_STATUS.SUBMITTED,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else {
    batch.set(reportRef, {
      scheduleId,
      lecturerId,
      courseId,
      batchId,
      ...fields,
      status: REPORT_STATUS.SUBMITTED,
      materialCount: 0,
      paymentProcessed: false,
      paymentId: null,
      submittedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  batch.update(doc(db, COLLECTIONS.CLASS_SCHEDULES, scheduleId), {
    status: SCHEDULE_STATUS.COMPLETED,
    reportId: scheduleId,
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
}
