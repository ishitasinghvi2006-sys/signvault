import Signature from '../models/Signature.js'
import Document from '../models/Document.js'

// POST /api/signatures — save signature position
export const createSignature = async (req, res) => {
  try {
    const { documentId, signerEmail, x, y, page, width, height } = req.body

    // Verify doc belongs to this user
    const doc = await Document.findOne({ _id: documentId, owner: req.userId })
    if (!doc) return res.status(404).json({ message: 'Document not found' })

    const signature = await Signature.create({
      documentId, signerEmail, x, y,
      page: page || 1,
      width: width || 200,
      height: height || 60
    })

    // Update document status to pending
    await Document.findByIdAndUpdate(documentId, {
      status: 'pending',
      signerEmail
    })

    res.status(201).json({ message: 'Signature field placed', signature })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/signatures/:docId — get all signatures for a doc
export const getSignatures = async (req, res) => {
  try {
    const signatures = await Signature.find({ documentId: req.params.docId })
    res.json(signatures)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/signatures/:id/sign — signer accepts
export const signDocument = async (req, res) => {
  try {
    const { signatureData } = req.body
    const sig = await Signature.findByIdAndUpdate(
      req.params.id,
      { status: 'signed', signedAt: new Date(), signatureData },
      { new: true }
    )
    if (!sig) return res.status(404).json({ message: 'Signature not found' })

    // Check if all signatures on this doc are signed
    const allSigs = await Signature.find({ documentId: sig.documentId })
    const allSigned = allSigs.every(s => s.status === 'signed')
    if (allSigned) {
      await Document.findByIdAndUpdate(sig.documentId, { status: 'signed' })
    }

    res.json({ message: 'Document signed', signature: sig })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/signatures/:id/reject — signer rejects
export const rejectDocument = async (req, res) => {
  try {
    const { rejectionReason } = req.body
    const sig = await Signature.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: rejectionReason || '' },
      { new: true }
    )
    if (!sig) return res.status(404).json({ message: 'Signature not found' })
    await Document.findByIdAndUpdate(sig.documentId, { status: 'rejected' })
    res.json({ message: 'Signature rejected', signature: sig })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}