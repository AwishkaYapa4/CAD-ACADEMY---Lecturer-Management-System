import { deleteObject, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { doc, increment, serverTimestamp, writeBatch } from 'firebase/firestore'

import { db, storage } from '@/config/firebase'
import { COLLECTIONS } from '@/constants/collections'
import { classMaterialPath } from '@/constants/storage'
import { createFirestoreService, orderBy, where } from '@/services/firestoreService'

export const materialsCollection = createFirestoreService(COLLECTIONS.CLASS_MATERIALS)

export function scheduleMaterialConstraints(scheduleId) {
  return [where('scheduleId', '==', scheduleId), orderBy('uploadedAt', 'asc')]
}

export function lecturerMaterialConstraints(lecturerId) {
  return [where('lecturerId', '==', lecturerId), orderBy('uploadedAt', 'desc')]
}

/**
 * Uploads a file to Storage at class-materials/{lecturerId}/{scheduleId}/{fileName}
 * then records its metadata in Firestore, bumping the report's materialCount.
 * `onProgress` receives a 0-100 number.
 */
export function uploadMaterial({ file, lecturerId, scheduleId, courseId, batchId }, onProgress) {
  const storagePath = classMaterialPath(lecturerId, scheduleId, file.name)
  const storageRef = ref(storage, storagePath)
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
      },
      reject,
      async () => {
        try {
          await getDownloadURL(uploadTask.snapshot.ref)

          const batch = writeBatch(db)
          const materialRef = materialsCollection.docRef(
            `${scheduleId}-${Date.now()}-${file.name}`.replace(/[^a-zA-Z0-9-_.]/g, '_')
          )

          batch.set(materialRef, {
            reportId: scheduleId,
            scheduleId,
            lecturerId,
            courseId,
            batchId,
            fileName: file.name,
            storagePath,
            contentType: file.type,
            size: file.size,
            uploadedAt: serverTimestamp(),
          })
          batch.update(doc(db, COLLECTIONS.CLASS_REPORTS, scheduleId), {
            materialCount: increment(1),
            updatedAt: serverTimestamp(),
          })
          await batch.commit()
          resolve()
        } catch (error) {
          reject(error)
        }
      }
    )
  })
}

export async function getMaterialDownloadUrl(material) {
  return getDownloadURL(ref(storage, material.storagePath))
}

export async function deleteMaterial(material) {
  await deleteObject(ref(storage, material.storagePath)).catch(() => {})

  const batch = writeBatch(db)
  batch.delete(materialsCollection.docRef(material.id))
  batch.update(doc(db, COLLECTIONS.CLASS_REPORTS, material.scheduleId), {
    materialCount: increment(-1),
    updatedAt: serverTimestamp(),
  })
  await batch.commit()
}
