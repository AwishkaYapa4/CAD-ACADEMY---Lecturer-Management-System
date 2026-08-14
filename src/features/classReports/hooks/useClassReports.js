import { useMutation } from '@tanstack/react-query'

import { useFirestoreCollection } from '@/hooks/useFirestoreCollection'
import { useFirestoreDoc } from '@/hooks/useFirestoreDoc'
import { orderBy } from '@/services/firestoreService'
import {
  batchReportConstraints,
  classReportsCollection,
  lecturerReportConstraints,
  saveReportDraft,
  submitReport,
} from '@/features/classReports/services/classReportService'

const ALL_REPORTS_ORDER = [orderBy('createdAt', 'desc')]

export function useClassReports() {
  return useFirestoreCollection(classReportsCollection.subscribe, ALL_REPORTS_ORDER, [])
}

export function useLecturerReports(lecturerId) {
  return useFirestoreCollection(
    classReportsCollection.subscribe,
    lecturerId ? lecturerReportConstraints(lecturerId) : [],
    [lecturerId]
  )
}

export function useBatchReports(batchId) {
  return useFirestoreCollection(
    classReportsCollection.subscribe,
    batchId ? batchReportConstraints(batchId) : [],
    [batchId]
  )
}

/** `scheduleId` doubles as the classReports doc id. */
export function useClassReport(scheduleId) {
  return useFirestoreDoc(classReportsCollection.subscribeToDoc, scheduleId)
}

export function useSaveReportDraft() {
  return useMutation({
    mutationFn: async ({ scheduleId, data }) => {
      await saveReportDraft(scheduleId, data)
    },
  })
}

export function useSubmitReport() {
  return useMutation({
    mutationFn: async ({ scheduleId, data }) => {
      await submitReport(scheduleId, data)
    },
  })
}
