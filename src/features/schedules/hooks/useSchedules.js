import { useMutation } from '@tanstack/react-query'

import { useFirestoreCollection } from '@/hooks/useFirestoreCollection'
import { useFirestoreDoc } from '@/hooks/useFirestoreDoc'
import {
  SCHEDULE_ORDER,
  batchScheduleConstraints,
  cancelSchedule,
  createSchedule,
  deleteScheduleCascade,
  lecturerScheduleConstraints,
  schedulesCollection,
  updateSchedule,
} from '@/features/schedules/services/scheduleService'

export function useSchedules() {
  return useFirestoreCollection(schedulesCollection.subscribe, SCHEDULE_ORDER, [])
}

export function useSchedule(scheduleId) {
  return useFirestoreDoc(schedulesCollection.subscribeToDoc, scheduleId)
}

export function useLecturerSchedules(lecturerId) {
  return useFirestoreCollection(
    schedulesCollection.subscribe,
    lecturerId ? lecturerScheduleConstraints(lecturerId) : [],
    [lecturerId]
  )
}

export function useBatchSchedules(batchId) {
  return useFirestoreCollection(
    schedulesCollection.subscribe,
    batchId ? batchScheduleConstraints(batchId) : [],
    [batchId]
  )
}

export function useCreateSchedule() {
  return useMutation({
    mutationFn: async (data) => createSchedule(data),
  })
}

export function useUpdateSchedule() {
  return useMutation({
    mutationFn: async ({ scheduleId, data }) => {
      await updateSchedule(scheduleId, data)
    },
  })
}

export function useCancelSchedule() {
  return useMutation({
    mutationFn: async (scheduleId) => {
      await cancelSchedule(scheduleId)
    },
  })
}

export function useDeleteSchedule() {
  return useMutation({
    mutationFn: async ({ scheduleId, lecturerId }) => {
      await deleteScheduleCascade(scheduleId, lecturerId)
    },
  })
}
