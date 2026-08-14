import { useMutation } from '@tanstack/react-query'

import { orderBy } from '@/services/firestoreService'
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection'
import {
  deleteMaterial,
  lecturerMaterialConstraints,
  materialsCollection,
  scheduleMaterialConstraints,
} from '@/features/materials/services/materialService'

const ALL_MATERIALS_ORDER = [orderBy('uploadedAt', 'desc')]

export function useAllMaterials() {
  return useFirestoreCollection(materialsCollection.subscribe, ALL_MATERIALS_ORDER, [])
}

export function useScheduleMaterials(scheduleId) {
  return useFirestoreCollection(
    materialsCollection.subscribe,
    scheduleId ? scheduleMaterialConstraints(scheduleId) : [],
    [scheduleId]
  )
}

export function useLecturerMaterials(lecturerId) {
  return useFirestoreCollection(
    materialsCollection.subscribe,
    lecturerId ? lecturerMaterialConstraints(lecturerId) : [],
    [lecturerId]
  )
}

export function useDeleteMaterial() {
  return useMutation({ mutationFn: deleteMaterial })
}
