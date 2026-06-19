import express from 'express'
import authMiddleware from '../middleware/auth.js'
import {
  sendSigningLink,
  getSigningPage,
  submitSignature,
  submitRejection
} from '../controllers/signingController.js'

const router = express.Router()

// Protected — only doc owner can send link
router.post('/send', authMiddleware, sendSigningLink)

// Public — signer accesses via token URL
router.get('/:token', getSigningPage)
router.post('/:token/sign', submitSignature)
router.post('/:token/reject', submitRejection)

export default router