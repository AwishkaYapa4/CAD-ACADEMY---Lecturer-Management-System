import { Router } from 'express'

import {
  createMaterialUploadUrl,
  getMaterialDownloadUrl,
  listAllMaterials,
  listCourseMaterials,
  listMyMaterials,
  removeMaterial,
  uploadMaterial,
} from '../controllers/materials.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/authorize.js'

const router = Router()

// Only Admin/Lecturer may upload; per-course permission is checked in the
// controller (assertCanManageCourseMaterials). Two-step: get a presigned R2
// PUT URL, then (once the browser has PUT the file directly to R2) save the
// metadata — see server/services/r2Service.js.
router.post('/materials/upload-url', authenticate, requireRole('admin', 'lecturer'), createMaterialUploadUrl)
router.post('/materials', authenticate, requireRole('admin', 'lecturer'), uploadMaterial)

// Every signed-in role may list — per-course view permission (Admin/Staff
// always, Lecturer only for courses they teach) is checked in the controller.
router.get('/courses/:courseId/materials', authenticate, listCourseMaterials)

// Materials the caller uploaded themselves — powers the (view-only) My Materials page.
router.get('/materials/mine', authenticate, listMyMaterials)

router.get('/materials', authenticate, requireRole('admin', 'staff'), listAllMaterials)

router.get('/materials/:id/download', authenticate, getMaterialDownloadUrl)

router.delete('/materials/:id', authenticate, requireRole('admin', 'lecturer'), removeMaterial)

export default router
