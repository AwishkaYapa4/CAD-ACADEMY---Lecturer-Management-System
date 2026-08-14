import { useMutation } from '@tanstack/react-query'

import { useFirestoreCollection } from '@/hooks/useFirestoreCollection'
import { useFirestoreDoc } from '@/hooks/useFirestoreDoc'
import { orderBy } from '@/services/firestoreService'
import {
  createLecturer,
  lecturersCollection,
  setLecturerStatus,
  updateLecturer,
} from '@/features/lecturers/services/lecturerService'

const LECTURER_ORDER = [orderBy('fullName', 'asc')]

export function useLecturers() {
  return useFirestoreCollection(lecturersCollection.subscribe, LECTURER_ORDER, [])
}

/** `lecturerId` is the lecturers-collection doc id (route param), not the Auth uid. */
export function useLecturer(lecturerId) {
  return useFirestoreDoc(lecturersCollection.subscribeToDoc, lecturerId)
}

export function useCreateLecturer() {
  return useMutation({ mutationFn: createLecturer })
}

export function useUpdateLecturer() {
  return useMutation({
    mutationFn: ({ lecturer, data }) => updateLecturer(lecturer, data),
  })
}

export function useSetLecturerStatus() {
  return useMutation({
    mutationFn: ({ lecturer, active }) => setLecturerStatus(lecturer, active),
  })
}
