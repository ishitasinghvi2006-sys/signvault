import express from 'express'
import multer from 'multer'
import authMiddleware from '../middleware/auth.js'
import { uploadDoc, getDocs, getDocById, deleteDoc, getDocStats } from '../controllers/docController.js'

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Only PDF files allowed'))
  }
})

router.post('/upload', authMiddleware, upload.single('file'), uploadDoc)
router.get('/', authMiddleware, getDocs)           // ?status=pending&search=contract&page=1
router.get('/stats', authMiddleware, getDocStats)  // dashboard counts
router.get('/:id', authMiddleware, getDocById)
router.delete('/:id', authMiddleware, deleteDoc)

export default router