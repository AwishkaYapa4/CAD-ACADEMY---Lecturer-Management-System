import { useEffect } from 'react'
import { useUIStore } from '@/store/useUIStore'

/** Registers a friendly breadcrumb label for a dynamic route segment (e.g. a doc id) while mounted. */
export function useBreadcrumbLabel(segment, label) {
  const setBreadcrumbLabel = useUIStore((state) => state.setBreadcrumbLabel)
  const clearBreadcrumbLabel = useUIStore((state) => state.clearBreadcrumbLabel)

  useEffect(() => {
    if (!segment || !label) return
    setBreadcrumbLabel(segment, label)
    return () => clearBreadcrumbLabel(segment)
  }, [segment, label, setBreadcrumbLabel, clearBreadcrumbLabel])
}
