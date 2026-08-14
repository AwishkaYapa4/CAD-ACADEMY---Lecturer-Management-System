import { db } from '../config/firebaseAdmin.js'
import { ApiError } from './ApiError.js'

export async function getCourseOrThrow(courseId) {
  const snap = await db.collection('courses').doc(courseId).get()
  if (!snap.exists) {
    throw new ApiError(404, 'Course not found.')
  }
  return { id: snap.id, ...snap.data() }
}

/**
 * True if `lecturerId` actually teaches `courseId`, checked against every
 * place this app records that relationship — a course's optional default
 * `lecturerId` (src/types/entities.js CourseDoc), any `batches` doc pairing
 * them (the relationship this app's UI is actually built on, per project
 * memory), and `lecturerAssignments` (schema exists, rarely populated, still
 * honored). Matching any one of the three is enough.
 */
async function lecturerTeachesCourse(lecturerId, course) {
  if (!lecturerId) return false
  if (course.lecturerId === lecturerId) return true

  const batchesSnap = await db
    .collection('batches')
    .where('lecturerId', '==', lecturerId)
    .where('courseId', '==', course.id)
    .limit(1)
    .get()
  if (!batchesSnap.empty) return true

  const assignmentsSnap = await db
    .collection('lecturerAssignments')
    .where('lecturerId', '==', lecturerId)
    .where('courseId', '==', course.id)
    .where('active', '==', true)
    .limit(1)
    .get()
  return !assignmentsSnap.empty
}

/** Upload/manage permission: Admin always; Lecturer only for courses they teach. */
export async function assertCanManageCourseMaterials(user, course) {
  if (user.role === 'admin') return
  if (user.role === 'lecturer' && (await lecturerTeachesCourse(user.lecturerId, course))) return
  throw new ApiError(403, 'You do not have permission to manage materials for this course.')
}

/**
 * View/download permission: Admin/Staff always; Lecturer only for courses
 * they teach. This app has no student role/enrollment (see project memory —
 * "explicitly NOT a student management system"), so there is no fourth case.
 */
export async function assertCanViewCourseMaterials(user, course) {
  if (user.role === 'admin' || user.role === 'staff') return
  if (user.role === 'lecturer' && (await lecturerTeachesCourse(user.lecturerId, course))) return
  throw new ApiError(403, 'You do not have permission to view materials for this course.')
}
