// Allowed file types/size for the Cloudinary-backed lecture material upload
// (src/features/materials — course + week library, uploaded via the
// Materials API). Deliberately narrower than the existing class-report
// attachments in src/constants/storage.js (documents only, no zip/images) —
// this is client-side validation for instant feedback only; the real
// enforcement is server/config/materialTypes.js, which this must stay in
// sync with.
export const ALLOWED_MATERIAL_MIME_TYPES = Object.freeze({
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
})

export const ALLOWED_MATERIAL_EXTENSIONS = '.pdf, .doc, .docx, .ppt, .pptx'

export const MAX_MATERIAL_FILE_SIZE_MB = 25
export const MAX_MATERIAL_FILE_SIZE_BYTES = MAX_MATERIAL_FILE_SIZE_MB * 1024 * 1024
