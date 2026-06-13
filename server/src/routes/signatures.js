import express from 'express'
import authMiddleware from '../middleware/auth.js'
import {
  createSignature,
  getSignatures,
  signDocument,
  rejectDocument
} from '../controllers/signatureController.js'

const router = express.Router()

router.post('/', authMiddleware, createSignature)
router.get('/:docId', getSignatures)              // public — signer can view
router.patch('/:id/sign', signDocument)             // public — signer signs
router.patch('/:id/reject', rejectDocument)         // public — signer rejects

export default router