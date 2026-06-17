import express from 'express'
import authMiddleware from '../middleware/auth.js'
import { getAuditTrail } from '../services/auditService.js'

const router = express.Router()
router.get('/:docId', authMiddleware, getAuditTrail)
export default router