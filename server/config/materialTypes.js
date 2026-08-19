// Allowed lecture-material file types for the R2 upload flow (materials.
// controller.js validates against this before issuing a presigned upload
// URL) — deliberately narrower than the existing class-report attachments
// (src/constants/storage.js's ACCEPTED_MATERIAL_TYPES, which also allows
// zip/jpeg/png for a different feature). Mirrored on the frontend in
// src/constants/lectureMaterials.js for instant client-side validation —
// keep both lists in sync; this one is what's actually enforced.
export const ALLOWED_MATERIAL_MIME_TYPES = Object.freeze({
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
})

export const MAX_MATERIAL_FILE_SIZE_MB = 25
export const MAX_MATERIAL_FILE_SIZE_BYTES = MAX_MATERIAL_FILE_SIZE_MB * 1024 * 1024
