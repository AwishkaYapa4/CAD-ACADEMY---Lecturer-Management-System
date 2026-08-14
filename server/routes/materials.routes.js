import { Router } from 'express'

import { getMaterialDownloadUrl, listCourseMaterials, listMyMaterials, removeMaterial, uploadMaterial } from '../controllers/materials.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/authorize.js'
import { uploadMaterialFile } from '../middleware/upload.js'

const router = Router()

// Only Admin/Lecturer may upload; per-course permission is checked in the
// controller (assertCanManageCourseMaterials).
router.post('/materials/upload', authenticate, requireRole('admin', 'lecturer'), uploadMaterialFile, uploadMaterial)

// Every signed-in role may list — per-course view permission (Admin/Staff
// always, Lecturer only for courses they teach) is checked in the controller.
router.get('/courses/:courseId/materials', authenticate, listCourseMaterials)

// Materials the caller uploaded themselves — powers the (view-only) My Materials page.
router.get('/materials/mine', authenticate, listMyMaterials)

router.get('/materials/:id/download', authenticate, getMaterialDownloadUrl)

router.delete('/materials/:id', authenticate, requireRole('admin', 'lecturer'), removeMaterial)

export default router
