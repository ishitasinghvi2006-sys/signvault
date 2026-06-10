import express from 'express'
import multer from 'multer'
import authMiddleware from '../middleware/auth.js'
import { uploadDoc, getDocs, getDocById } from '../controllers/docController.js'

const router = express.Router()

// Multer — store file in memory (for Supabase upload)
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files allowed'), false)
    }
  }
})

router.post('/upload', authMiddleware, upload.single('file'), uploadDoc)
router.get('/', authMiddleware, getDocs)
router.get('/:id', authMiddleware, getDocById)

export default router