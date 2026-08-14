import path from 'node:path'

import { ALLOWED_MATERIAL_MIME_TYPES } from '../config/materialTypes.js'
import { deleteRawMaterial, getSignedMaterialUrl, uploadRawMaterial } from '../services/cloudinaryService.js'
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

export const uploadMaterial = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'A file is required.')
  }

  const courseId = requireField(req.body.courseId, 'Course')
  const week = parseWeek(req.body.week)
  const title = requireField(req.body.title, 'Title')
  const description =
    typeof req.body.description === 'string' ? req.body.description.trim().slice(0, 2000) : ''
  // Optional — set when uploaded from the "Complete Class" flow
  // (SubmitReportPage), so materialCount on that report can stay in sync.
  const scheduleId =
    typeof req.body.scheduleId === 'string' && req.body.scheduleId.trim() ? req.body.scheduleId.trim() : null

  const ext = path.extname(req.file.originalname).toLowerCase()
  if (ALLOWED_MATERIAL_MIME_TYPES[req.file.mimetype] !== ext) {
    throw new ApiError(400, 'Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX.')
  }

  // Validate the course + this caller's permission for it BEFORE spending an
  // upload against Cloudinary.
  const course = await getCourseOrThrow(courseId)
  await assertCanManageCourseMaterials(req.user, course)

  let uploadResult
  try {
    uploadResult = await uploadRawMaterial(req.file.buffer, {
      courseId,
      week,
      originalFilename: req.file.originalname,
    })
  } catch (error) {
    console.error('[materials-api] Cloudinary upload failed', error)
    throw new ApiError(502, 'Failed to upload the file to storage. Please try again.')
  }

  try {
    const material = await createMaterial({
      courseId,
      week,
      title,
      description,
      originalFilename: req.file.originalname,
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryAssetId: uploadResult.asset_id,
      resourceType: uploadResult.resource_type,
      format: ext.replace('.', ''),
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
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
    // Firestore write failed after the Cloudinary upload already succeeded —
    // clean up the now-orphaned asset rather than leave it unreferenced.
    console.error('[materials-api] Failed to save material metadata, rolling back Cloudinary asset', error)
    await deleteRawMaterial(uploadResult.public_id).catch(() => {})
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

  const { url, expiresAt } = getSignedMaterialUrl(material.cloudinaryPublicId, { attachment: true })
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

  await deleteRawMaterial(material.cloudinaryPublicId).catch((error) => {
    console.error('[materials-api] Failed to delete Cloudinary asset', material.cloudinaryPublicId, error)
  })
  await deleteMaterialDoc(material.id)
  if (material.scheduleId) {
    await adjustReportMaterialCount(material.scheduleId, -1)
  }

  res.json({ success: true })
})
