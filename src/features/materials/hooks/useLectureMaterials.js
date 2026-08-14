import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deleteLectureMaterial,
  getCourseMaterials,
  getLectureMaterialDownload,
  getMyLectureMaterials,
  uploadLectureMaterial,
} from '@/features/materials/services/lectureMaterialService'

const courseMaterialsKey = (courseId) => ['courseMaterials', courseId]
const myMaterialsKey = ['courseMaterials', 'mine']

/**
 * Unlike the rest of this app's data hooks, this isn't a realtime Firestore
 * subscription — the Materials API is a plain REST endpoint, so this is a
 * regular React Query fetch (first use of useQuery in this codebase; every
 * other feature reads Firestore directly via onSnapshot).
 */
export function useCourseMaterials(courseId) {
  const query = useQuery({
    queryKey: courseMaterialsKey(courseId),
    queryFn: () => getCourseMaterials(courseId),
    enabled: Boolean(courseId),
  })
  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

/** Materials the signed-in lecturer uploaded themselves — the (view-only) My Materials page. */
export function useMyLectureMaterials() {
  const query = useQuery({
    queryKey: myMaterialsKey,
    queryFn: getMyLectureMaterials,
  })
  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useUploadLectureMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, courseId, week, title, description, scheduleId, onProgress }) =>
      uploadLectureMaterial({ file, courseId, week, title, description, scheduleId }, onProgress),
    onSuccess: (material) => {
      queryClient.invalidateQueries({ queryKey: courseMaterialsKey(material.courseId) })
      queryClient.invalidateQueries({ queryKey: myMaterialsKey })
    },
  })
}

export function useDeleteLectureMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }) => deleteLectureMaterial(id),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: courseMaterialsKey(courseId) })
      queryClient.invalidateQueries({ queryKey: myMaterialsKey })
    },
  })
}

export function useLectureMaterialDownload() {
  return useMutation({
    mutationFn: (materialId) => getLectureMaterialDownload(materialId),
  })
}
