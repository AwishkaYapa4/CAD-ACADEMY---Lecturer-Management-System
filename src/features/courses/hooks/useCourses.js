import { useMutation } from '@tanstack/react-query'

import { useFirestoreCollection } from '@/hooks/useFirestoreCollection'
import { useFirestoreDoc } from '@/hooks/useFirestoreDoc'
import {
  COURSE_ORDER,
  coursesCollection,
  createCourse,
  setCourseActive,
  updateCourse,
} from '@/features/courses/services/courseService'

export function useCourses() {
  return useFirestoreCollection(coursesCollection.subscribe, COURSE_ORDER, [])
}

export function useCourse(courseId) {
  return useFirestoreDoc(coursesCollection.subscribeToDoc, courseId)
}

export function useCreateCourse() {
  return useMutation({ mutationFn: createCourse })
}

export function useUpdateCourse() {
  return useMutation({
    mutationFn: ({ courseId, data }) => updateCourse(courseId, data),
  })
}

export function useSetCourseActive() {
  return useMutation({
    mutationFn: ({ courseId, active }) => setCourseActive(courseId, active),
  })
}
