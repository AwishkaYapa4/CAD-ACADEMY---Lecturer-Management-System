import path from 'node:path'
import multer from 'multer'

import { ALLOWED_MATERIAL_MIME_TYPES, MAX_MATERIAL_FILE_SIZE_BYTES, MAX_MATERIAL_FILE_SIZE_MB } from '../config/materialTypes.js'
import { ApiError } from '../utils/ApiError.js'

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase()
  const expectedExt = ALLOWED_MATERIAL_MIME_TYPES[file.mimetype]
  // Belt-and-braces: both the declared mime type AND the filename extension
  // must be on the allow-list, and they must agree with each other — a
  // renamed .exe posing as application/pdf still gets rejected.
  if (!expectedExt || ext !== expectedExt) {
    cb(new ApiError(400, 'Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX.'))
    return
  }
  cb(null, true)
}

const singleFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MATERIAL_FILE_SIZE_BYTES, files: 1 },
  fileFilter,
}).single('file')

/** Normalizes every multer failure mode (size limit, filter rejection, malformed request) into an ApiError. */
export function uploadMaterialFile(req, res, next) {
  singleFile(req, res, (err) => {
    if (!err) return next()
    if (err instanceof ApiError) return next(err)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, `File exceeds the ${MAX_MATERIAL_FILE_SIZE_MB}MB limit.`))
    }
    next(new ApiError(400, err.message || 'Failed to process the uploaded file.'))
  })
}
