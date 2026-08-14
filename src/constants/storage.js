// Storage path convention: class-materials/{lecturerId}/{scheduleId}/{fileName}
// `lecturerId` is the lecturers/{lecturerId} doc id (not the Auth uid).
// Keeping the builder here means the path never drifts between the upload
// service and storage.rules.
export function classMaterialPath(lecturerId, scheduleId, fileName) {
  return `class-materials/${lecturerId}/${scheduleId}/${fileName}`
}

export const ACCEPTED_MATERIAL_TYPES = Object.freeze({
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'image/jpeg': '.jpg',
  'image/png': '.png',
})

export const MAX_MATERIAL_FILE_SIZE_MB = 25
