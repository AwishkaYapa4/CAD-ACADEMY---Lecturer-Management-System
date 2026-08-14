import { apiFetch, apiUpload } from '@/lib/apiClient'

/**
 * Client for the Cloudinary-backed lecture material Materials API
 * (server/routes/materials.routes.js) — a course + week material library,
 * distinct from the Firebase-Storage-backed classMaterials feature in
 * materialService.js (which attaches files to one class report). Nothing
 * here talks to Firestore directly; the backend holds the Cloudinary secret
 * and the Firebase Admin credentials.
 */

/**
 * `scheduleId` is optional — set when uploading from the "Complete Class"
 * flow (SubmitReportPage) so the backend can keep that report's
 * materialCount in sync. Every lecturer upload goes through that flow now;
 * Admin's general library page (AdminMaterialsPage) omits it.
 */
export function uploadLectureMaterial({ file, courseId, week, title, description, scheduleId }, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('courseId', courseId)
  formData.append('week', String(week))
  formData.append('title', title)
  if (description) formData.append('description', description)
  if (scheduleId) formData.append('scheduleId', scheduleId)

  return apiUpload('/api/materials/upload', formData, onProgress).then((res) => res.material)
}

export function getCourseMaterials(courseId) {
  return apiFetch(`/api/courses/${courseId}/materials`).then((res) => res.materials)
}

/** Materials the signed-in caller uploaded themselves — powers the (view-only) My Materials page. */
export function getMyLectureMaterials() {
  return apiFetch('/api/materials/mine').then((res) => res.materials)
}

/** Returns { url, expiresAt, originalFilename, title } — a short-lived signed Cloudinary URL. */
export function getLectureMaterialDownload(materialId) {
  return apiFetch(`/api/materials/${materialId}/download`)
}

export function deleteLectureMaterial(materialId) {
  return apiFetch(`/api/materials/${materialId}`, { method: 'DELETE' })
}
