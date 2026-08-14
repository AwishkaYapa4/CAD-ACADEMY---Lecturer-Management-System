import { useMutation } from '@tanstack/react-query'

import { useFirestoreCollection } from '@/hooks/useFirestoreCollection'
import { useFirestoreDoc } from '@/hooks/useFirestoreDoc'
import {
  BATCH_ORDER,
  batchesCollection,
  createBatch,
  lecturerBatchConstraints,
  setBatchActive,
  updateBatch,
} from '@/features/batches/services/batchService'

export function useBatches() {
  return useFirestoreCollection(batchesCollection.subscribe, BATCH_ORDER, [])
}

export function useBatch(batchId) {
  return useFirestoreDoc(batchesCollection.subscribeToDoc, batchId)
}

export function useLecturerBatches(lecturerId) {
  return useFirestoreCollection(
    batchesCollection.subscribe,
    lecturerId ? lecturerBatchConstraints(lecturerId) : [],
    [lecturerId]
  )
}

export function useCreateBatch() {
  return useMutation({ mutationFn: createBatch })
}

export function useUpdateBatch() {
  return useMutation({
    mutationFn: ({ batchId, data }) => updateBatch(batchId, data),
  })
}

export function useSetBatchActive() {
  return useMutation({
    mutationFn: ({ batchId, active }) => setBatchActive(batchId, active),
  })
}
