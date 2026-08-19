import { randomUUID } from 'node:crypto'

import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { r2, R2_BUCKET } from '../config/r2.js'

// Short-lived — these URLs only need to survive one browser round trip
// (upload) or one click (download), not sit around as a durable link.
const UPLOAD_URL_TTL_SECONDS = 5 * 60
const DOWNLOAD_URL_TTL_SECONDS = 5 * 60

/**
 * materials/{courseId}/week-{week}/{uuid}{ext} — the uuid keeps keys
 * unguessable and collision-free; the human-readable original filename is
 * stored in Firestore (originalFilename), never in the key, so it never
 * needs URL-encoding or sanitizing.
 */
export function buildMaterialKey({ courseId, week, ext }) {
  return `materials/${courseId}/week-${week}/${randomUUID()}${ext}`
}

/**
 * A presigned PUT URL the browser uploads straight to — the file's bytes
 * never pass through the Express function, so the 25MB material size limit
 * never has to fit inside Vercel's serverless request-body cap.
 */
export async function getMaterialUploadUrl(key, contentType) {
  const command = new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType })
  const url = await getSignedUrl(r2, command, { expiresIn: UPLOAD_URL_TTL_SECONDS })
  return { url, expiresAt: Date.now() + UPLOAD_URL_TTL_SECONDS * 1000 }
}

/**
 * Confirms the browser's direct PUT actually landed in R2 before Firestore
 * ever hears about this material — without this check a client could call
 * the save-metadata endpoint for a key it never uploaded to.
 */
export async function materialObjectExists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    return true
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 404) return false
    throw error
  }
}

/** Presigned GET URL that forces a download with the original filename rather than the opaque R2 key. */
export async function getMaterialDownloadUrl(key, originalFilename) {
  const asciiName = originalFilename.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '')
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(originalFilename)}`,
  })
  const url = await getSignedUrl(r2, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS })
  return { url, expiresAt: Date.now() + DOWNLOAD_URL_TTL_SECONDS * 1000 }
}

export async function deleteMaterialObject(key) {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
}
