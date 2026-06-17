import Signature from '../models/Signature.js'
import Document from '../models/Document.js'
import { logAction } from '../services/auditService.js'  // add at top


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
import { generateSignedPDF } from '../services/pdfService.js'

// POST /api/signatures/finalize — generate signed PDF
export const finalizePDF = async (req, res) => {
  try {
    const { docId } = req.body

    // Get document (verify ownership)
    const doc = await Document.findOne({ _id: docId, owner: req.userId })
    if (!doc) return res.status(404).json({ message: 'Document not found' })

    // Get all signatures for this document
    const signatures = await Signature.find({ documentId: docId })
    if (signatures.length === 0) {
      return res.status(400).json({ message: 'No signature fields found on this document' })
    }

    // Generate the signed PDF
    const signedUrl = await generateSignedPDF(doc, signatures)

    // Save the signed URL and mark as signed
    await Document.findByIdAndUpdate(docId, {
      signedFileUrl: signedUrl,
      status: 'signed'
    })

    res.json({
      message: 'Signed PDF generated successfully',
      signedFileUrl: signedUrl
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message })
  }
}