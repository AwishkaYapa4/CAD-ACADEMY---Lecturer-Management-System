import path from 'node:path'

import { cloudinary } from '../config/cloudinary.js'

const FOLDER_ROOT = 'lms-materials'
const SIGNED_URL_TTL_SECONDS = 5 * 60 // matches the "temporary" download-link requirement

function slugify(name) {
  return (
    name
      .normalize('NFKD')
      .replace(/[^\w.\- ]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80) || 'material'
  )
}

/**
 * Cloudinary "raw" assets are delivered exactly as stored — unlike images,
 * there's no automatic format handling, so the extension has to live inside
 * the public_id itself or the delivered file loses it. Folder layout matches
 * the spec: lms-materials/{courseId}/week-{week}/...
 */
function buildPublicId({ courseId, week, originalFilename }) {
  const ext = path.extname(originalFilename).toLowerCase()
  const base = slugify(path.basename(originalFilename, ext))
  return `${FOLDER_ROOT}/${courseId}/week-${week}/${Date.now()}-${base}${ext}`
}

/**
 * Uploads a document buffer as a Cloudinary raw asset under restricted
 * ("authenticated") delivery — the asset is not publicly reachable by URL
 * alone, only via a signed URL (see getSignedMaterialUrl below). Uses the
 * current, non-deprecated upload_stream API.
 */
export function uploadRawMaterial(buffer, { courseId, week, originalFilename }) {
  const publicId = buildPublicId({ courseId, week, originalFilename })

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        type: 'authenticated',
        public_id: publicId,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )
    uploadStream.end(buffer)
  })
}

export async function deleteRawMaterial(publicId) {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    invalidate: true,
  })
}

/**
 * Generates a short-lived signed URL for an authenticated raw asset — this
 * is what makes the asset temporarily fetchable despite restricted delivery.
 * `attachment: true` sets Content-Disposition so browsers download rather
 * than try to render the raw file inline.
 */
export function getSignedMaterialUrl(publicId, { attachment = false } = {}) {
  const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS
  const url = cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
    flags: attachment ? 'attachment' : undefined,
  })
  return { url, expiresAt }
}
