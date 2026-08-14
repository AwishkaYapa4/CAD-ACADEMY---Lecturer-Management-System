import { COLLECTIONS } from '@/constants/collections'
import { createFirestoreService, orderBy } from '@/services/firestoreService'

export const coursesCollection = createFirestoreService(COLLECTIONS.COURSES)

export const COURSE_ORDER = [orderBy('name', 'asc')]

export async function createCourse({ name, description, duration, lecturerId }) {
  return coursesCollection.create({
    name,
    description: description || '',
    duration: duration || '',
    lecturerId: lecturerId || '',
    active: true,
  })
}

export async function updateCourse(courseId, { name, description, duration, lecturerId }) {
  await coursesCollection.update(courseId, {
    name,
    description: description || '',
    duration: duration || '',
    lecturerId: lecturerId || '',
  })
}

export async function setCourseActive(courseId, active) {
  await coursesCollection.update(courseId, { active })
}
