import path from 'node:path'

import { ALLOWED_MATERIAL_MIME_TYPES, MAX_MATERIAL_FILE_SIZE_BYTES, MAX_MATERIAL_FILE_SIZE_MB } from '../config/materialTypes.js'
import {
  buildMaterialKey,
  deleteMaterialObject,
  getMaterialDownloadUrl as getSignedDownloadUrl,
  getMaterialUploadUrl,
  materialObjectExists,
} from '../services/r2Service.js'
import {
  adjustReportMaterialCount,
  createMaterial,
  deleteMaterial as deleteMaterialDoc,
  getMaterialById,
  listMaterialsByCourse,
  listMaterialsByUploader,
} from '../services/materialsService.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { assertCanManageCourseMaterials, assertCanViewCourseMaterials, getCourseOrThrow } from '../utils/materialAccess.js'

function requireField(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, `${field} is required.`)
  }
  return value.trim()
}

function parseWeek(value) {
  const week = Number(value)
  if (!Number.isInteger(week) || week < 1 || week > 104) {
    throw new ApiError(400, 'Week must be a positive whole number.')
  }
  return week
}

/** Shared by both endpoints below — the upload-url step and the save-metadata step must agree on the same filename/type/size rules. */
function validateFileMeta({ filename, mimeType, sizeBytes }) {
  const name = requireField(filename, 'File name')
  const ext = path.extname(name).toLowerCase()
  if (ALLOWED_MATERIAL_MIME_TYPES[mimeType] !== ext) {
    throw new ApiError(400, 'Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX.')
  }
  const size = Number(sizeBytes)
  if (!Number.isFinite(size) || size <= 0 || size > MAX_MATERIAL_FILE_SIZE_BYTES) {
    throw new ApiError(400, `File exceeds the ${MAX_MATERIAL_FILE_SIZE_MB}MB limit.`)
  }
  return { name, ext, size }
}

/**
 * Step 1 of the upload flow: validate + check permission, then hand back a
 * short-lived presigned PUT URL so the browser can upload the file straight
 * to R2 (the file's bytes never pass through this server).
 */
export const createMaterialUploadUrl = asyncHandler(async (req, res) => {
  const courseId = requireField(req.body.courseId, 'Course')
  const week = parseWeek(req.body.week)
  const { ext } = validateFileMeta(req.body)

  const course = await getCourseOrThrow(courseId)
  await assertCanManageCourseMaterials(req.user, course)

  const key = buildMaterialKey({ courseId, week, ext })
  const { url, expiresAt } = await getMaterialUploadUrl(key, req.body.mimeType)
  res.json({ uploadUrl: url, key, expiresAt })
})

/**
 * Step 2: called once the browser's direct PUT to R2 has succeeded. Re-checks
 * permission (time may have passed since step 1) and confirms the object
 * actually exists in R2 before creating the Firestore record.
 */
export const uploadMaterial = asyncHandler(async (req, res) => {
  const courseId = requireField(req.body.courseId, 'Course')
  const week = parseWeek(req.body.week)
  const title = requireField(req.body.title, 'Title')
  const description =
    typeof req.body.description === 'string' ? req.body.description.trim().slice(0, 2000) : ''
  const r2Key = requireField(req.body.r2Key, 'File key')
  // Optional — set when uploaded from the "Complete Class" flow
  // (SubmitReportPage), so materialCount on that report can stay in sync.
  const scheduleId =
    typeof req.body.scheduleId === 'string' && req.body.scheduleId.trim() ? req.body.scheduleId.trim() : null

  const { name: originalFilename, ext } = validateFileMeta({
    filename: req.body.originalFilename,
    mimeType: req.body.mimeType,
    sizeBytes: req.body.sizeBytes,
  })

  const course = await getCourseOrThrow(courseId)
  await assertCanManageCourseMaterials(req.user, course)

  // r2Key is expected to have been issued by createMaterialUploadUrl for
  // this exact course/week — reject anything else outright rather than let
  // a caller point a material record at an arbitrary key.
  if (!r2Key.startsWith(`materials/${courseId}/week-${week}/`)) {
    throw new ApiError(400, 'File key does not match this course/week.')
  }

  if (!(await materialObjectExists(r2Key))) {
    throw new ApiError(400, 'Upload not found in storage. Please try uploading again.')
  }

  try {
    const material = await createMaterial({
      courseId,
      week,
      title,
      description,
      originalFilename,
      r2Key,
      format: ext.replace('.', ''),
      mimeType: req.body.mimeType,
      sizeBytes: Number(req.body.sizeBytes),
      uploadedBy: req.user.uid,
      uploadedByName: req.user.fullName ?? req.user.email ?? '',
      uploadedByRole: req.user.role,
      ...(scheduleId ? { scheduleId } : {}),
    })
    if (scheduleId) {
      await adjustReportMaterialCount(scheduleId, 1)
    }
    res.status(201).json({ material })
  } catch (error) {
    // Firestore write failed after the R2 object already exists — clean up
    // the now-orphaned object rather than leave it unreferenced.
    console.error('[materials-api] Failed to save material metadata, rolling back R2 object', error)
    await deleteMaterialObject(r2Key).catch(() => {})
    throw new ApiError(500, 'Failed to save the material. Please try again.')
  }
})

export const listCourseMaterials = asyncHandler(async (req, res) => {
  const course = await getCourseOrThrow(req.params.courseId)
  await assertCanViewCourseMaterials(req.user, course)

  const materials = await listMaterialsByCourse(course.id)
  res.json({ materials })
})

/** Materials the caller themselves uploaded — powers the (view-only) My Materials page. */
export const listMyMaterials = asyncHandler(async (req, res) => {
  const materials = await listMaterialsByUploader(req.user.uid)
  res.json({ materials })
})

export const getMaterialDownloadUrl = asyncHandler(async (req, res) => {
  const material = await getMaterialById(req.params.id)
  if (!material) {
    throw new ApiError(404, 'Material not found.')
  }

  const course = await getCourseOrThrow(material.courseId)
  await assertCanViewCourseMaterials(req.user, course)

  const { url, expiresAt } = await getSignedDownloadUrl(material.r2Key, material.originalFilename)
  res.json({
    url,
    expiresAt,
    originalFilename: material.originalFilename,
    title: material.title,
  })
})

export const removeMaterial = asyncHandler(async (req, res) => {
  const material = await getMaterialById(req.params.id)
  if (!material) {
    throw new ApiError(404, 'Material not found.')
  }

  const course = await getCourseOrThrow(material.courseId)
  const isOwnUpload = material.uploadedBy === req.user.uid

  if (req.user.role === 'admin') {
    // Admin may delete any material.
  } else if (req.user.role === 'lecturer' && isOwnUpload) {
    await assertCanManageCourseMaterials(req.user, course)
  } else {
    throw new ApiError(403, 'You do not have permission to delete this material.')
  }

  await deleteMaterialObject(material.r2Key).catch((error) => {
    console.error('[materials-api] Failed to delete R2 object', material.r2Key, error)
  })
  await deleteMaterialDoc(material.id)
  if (material.scheduleId) {
    await adjustReportMaterialCount(material.scheduleId, -1)
  }

  res.json({ success: true })
})
