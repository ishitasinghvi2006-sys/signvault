import Document from '../models/Document.js'
import supabase from '../supabase.js'

// UPLOAD PDF
export const uploadDoc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const { title, signerEmail } = req.body
    const file = req.file
    const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '-')}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(`pdfs/${fileName}`, file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (error) {
      return res.status(500).json({ message: 'Supabase upload failed', error: error.message })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(`pdfs/${fileName}`)

    // Save to MongoDB
    const doc = await Document.create({
      owner: req.userId,
      title: title || file.originalname,
      fileName,
      fileUrl: urlData.publicUrl,
      fileSize: file.size,
      signerEmail: signerEmail || ''
    })

    res.status(201).json({ message: 'Document uploaded', document: doc })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET ALL DOCS for logged-in user
export const getDocs = async (req, res) => {
  try {
    const docs = await Document.find({ owner: req.userId })
      .sort({ createdAt: -1 })
    res.json(docs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET SINGLE DOC
export const getDocById = async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      owner: req.userId
    })
    if (!doc) return res.status(404).json({ message: 'Document not found' })
    res.json(doc)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}