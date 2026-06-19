import express from 'express'
import authMiddleware from '../middleware/auth.js'
import { getAuditTrail } from '../services/auditService.js'

const router = express.Router()

// GET /api/audit/:docId — get audit trail for a document
router.get('/:docId', authMiddleware, getAuditTrail)

export default router