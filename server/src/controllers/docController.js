import Document from '../models/Document.js'
import supabase from '../supabase.js'
import { logAction } from '../services/auditService.js'

// ─── POST /api/docs/upload ───
export const uploadDoc = async (req, res) => {
  try {
    const { title } = req.body
    const file = req.file

    if (!file) return res.status(400).json({ message: 'No file uploaded' })

    // Upload to Supabase Storage
    const fileName = `${Date.now()}_${file.originalname}`
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(`uploads/${fileName}`, file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (error) throw new Error(error.message)

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(`uploads/${fileName}`)

    const doc = await Document.create({
      owner: req.userId,
      title: title || file.originalname,
      fileName: file.originalname,
      fileUrl: urlData.publicUrl,
      fileSize: file.size,
      status: 'draft'
    })

    await logAction({
      documentId: doc._id,
      action: 'uploaded',
      actor: req.userId,
      details: `File: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`,
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
    })

    res.status(201).json({ message: 'Document uploaded', document: doc })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── GET /api/docs ─── list docs with optional status filter (Day 12)
// Query params: ?status=draft|pending|signed|rejected&search=keyword&page=1&limit=10
export const getDocs = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query

    const filter = { owner: req.userId }

    // Filter by status
    if (status && ['draft', 'pending', 'signed', 'rejected'].includes(status)) {
      filter.status = status
    }

    // Search by title
    if (search) {
      filter.title = { $regex: search, $options: 'i' }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Document.countDocuments(filter)
    const docs = await Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    res.json({
      documents: docs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── GET /api/docs/:id ─── single doc
export const getDocById = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, owner: req.userId })
    if (!doc) return res.status(404).json({ message: 'Document not found' })
    res.json(doc)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── DELETE /api/docs/:id ─── delete doc (Day 12)
export const deleteDoc = async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({ _id: req.params.id, owner: req.userId })
    if (!doc) return res.status(404).json({ message: 'Document not found' })
    res.json({ message: 'Document deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── GET /api/docs/stats ─── dashboard counts (Day 12)
export const getDocStats = async (req, res) => {
  try {
    const [total, draft, pending, signed, rejected] = await Promise.all([
      Document.countDocuments({ owner: req.userId }),
      Document.countDocuments({ owner: req.userId, status: 'draft' }),
      Document.countDocuments({ owner: req.userId, status: 'pending' }),
      Document.countDocuments({ owner: req.userId, status: 'signed' }),
      Document.countDocuments({ owner: req.userId, status: 'rejected' })
    ])

    res.json({ total, draft, pending, signed, rejected })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}