import express from 'express'
import authMiddleware from '../middleware/auth.js'
import {
  createSignature,
  getSignatures,
  signDocument,
  rejectDocument,
  finalizePDF
} from '../controllers/signatureController.js'

const router = express.Router()

router.post('/', authMiddleware, createSignature)           // place field
router.get('/:docId', authMiddleware, getSignatures)        // get fields for doc
router.patch('/:id/sign', signDocument)                     // signer accepts (no auth — uses token flow)
router.patch('/:id/reject', rejectDocument)                 // signer rejects
router.post('/finalize', authMiddleware, finalizePDF)       // generate signed PDF

export default router