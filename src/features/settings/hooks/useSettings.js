import { useMutation } from '@tanstack/react-query'

import { useFirestoreDoc } from '@/hooks/useFirestoreDoc'
import {
  GENERAL_SETTINGS_DOC_ID,
  saveGeneralSettings,
  settingsCollection,
} from '@/features/settings/services/settingsService'

export function useGeneralSettings() {
  return useFirestoreDoc(settingsCollection.subscribeToDoc, GENERAL_SETTINGS_DOC_ID)
}

export function useSaveGeneralSettings() {
  return useMutation({ mutationFn: saveGeneralSettings })
}
