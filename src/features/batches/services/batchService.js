import { COLLECTIONS } from '@/constants/collections'
import { createFirestoreService, orderBy, where } from '@/services/firestoreService'

export const batchesCollection = createFirestoreService(COLLECTIONS.BATCHES)

export const BATCH_ORDER = [orderBy('startDate', 'desc')]

export function lecturerBatchConstraints(lecturerId) {
  return [where('lecturerId', '==', lecturerId), orderBy('startDate', 'desc')]
}

export async function createBatch({ batchCode, courseId, lecturerId, startDate, endDate, plannedClassCount }) {
  return batchesCollection.create({
    batchCode,
    courseId,
    lecturerId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    plannedClassCount: Number(plannedClassCount) || 0,
    completedClassCount: 0,
    active: true,
    archived: false,
  })
}

export async function updateBatch(batchId, { batchCode, courseId, lecturerId, startDate, endDate, plannedClassCount }) {
  await batchesCollection.update(batchId, {
    batchCode,
    courseId,
    lecturerId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    plannedClassCount: Number(plannedClassCount) || 0,
  })
}

export async function setBatchActive(batchId, active) {
  await batchesCollection.update(batchId, { active })
}

/** Derives a display status since there's no server-side transition — purely a function of dates/progress. */
export function deriveBatchStatus(batch) {
  const now = new Date()
  const start = batch.startDate?.toDate ? batch.startDate.toDate() : new Date(batch.startDate)
  const plannedReached =
    batch.plannedClassCount > 0 && batch.completedClassCount >= batch.plannedClassCount

  if (plannedReached) return 'completed'
  if (start > now) return 'upcoming'
  return 'active'
}
