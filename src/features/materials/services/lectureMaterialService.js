import { apiFetch, uploadToSignedUrl } from '@/lib/apiClient'

/**
 * Client for the R2-backed lecture material Materials API
 * (server/routes/materials.routes.js) — a course + week material library,
 * distinct from the Firebase-Storage-backed classMaterials feature in
 * materialService.js (which attaches files to one class report). Nothing
 * here talks to Firestore directly; the backend holds the R2 secret and the
 * Firebase Admin credentials.
 */

/**
 * Three-step upload: get a presigned R2 PUT URL, upload the file straight to
 * R2 (bypassing the Materials API entirely for the actual bytes), then save
 * the metadata. `onProgress` tracks the middle step, which is the one that
 * actually takes time.
 *
 * `scheduleId` is optional — set when uploading from the "Complete Class"
 * flow (SubmitReportPage) so the backend can keep that report's
 * materialCount in sync. Every lecturer upload goes through that flow now;
 * Admin's general library page (AdminMaterialsPage) omits it.
 */
export async function uploadLectureMaterial({ file, courseId, week, title, description, scheduleId }, onProgress) {
  const { uploadUrl, key } = await apiFetch('/api/materials/upload-url', {
    method: 'POST',
    body: { courseId, week, filename: file.name, mimeType: file.type, sizeBytes: file.size },
  })

  await uploadToSignedUrl(uploadUrl, file, onProgress)

  const res = await apiFetch('/api/materials', {
    method: 'POST',
    body: {
      courseId,
      week,
      title,
      description,
      scheduleId,
      r2Key: key,
      originalFilename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  })
  return res.material
}

export function getCourseMaterials(courseId) {
  return apiFetch(`/api/courses/${courseId}/materials`).then((res) => res.materials)
}

/** Materials the signed-in caller uploaded themselves — powers the (view-only) My Materials page. */
export function getMyLectureMaterials() {
  return apiFetch('/api/materials/mine').then((res) => res.materials)
}

/** Returns { url, expiresAt, originalFilename, title } — a short-lived signed R2 URL. */
export function getLectureMaterialDownload(materialId) {
  return apiFetch(`/api/materials/${materialId}/download`)
}

export function deleteLectureMaterial(materialId) {
  return apiFetch(`/api/materials/${materialId}`, { method: 'DELETE' })
}
