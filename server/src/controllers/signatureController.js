import Signature from '../models/Signature.js'
import Document from '../models/Document.js'
import { logAction } from '../services/auditService.js'
import { generateSignedPDF } from '../services/pdfService.js'

// ─── POST /api/signatures ─── place a signature field
export const createSignature = async (req, res) => {
  try {
    const { documentId, signerEmail, x, y, page, width, height } = req.body

    const doc = await Document.findOne({ _id: documentId, owner: req.userId })
    if (!doc) return res.status(404).json({ message: 'Document not found' })

    const signature = await Signature.create({
      documentId, signerEmail, x, y,
      page: page || 1,
      width: width || 200,
      height: height || 60
    })

    await Document.findByIdAndUpdate(documentId, { status: 'pending', signerEmail })

    await logAction({
      documentId,
      action: 'field_placed',
      actor: req.userId,
      details: `Signature field placed for ${signerEmail} on page ${page || 1}`,
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
    })

    res.status(201).json({ message: 'Signature field placed', signature })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── GET /api/signatures/:docId ─── get all signature fields for a doc
export const getSignatures = async (req, res) => {
  try {
    const signatures = await Signature.find({ documentId: req.params.docId })
    res.json(signatures)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── PATCH /api/signatures/:id/sign ─── signer accepts (Day 11)
export const signDocument = async (req, res) => {
  try {
    const { signatureData } = req.body

    const sig = await Signature.findByIdAndUpdate(
      req.params.id,
      { status: 'signed', signedAt: new Date(), signatureData },
      { new: true }
    )
    if (!sig) return res.status(404).json({ message: 'Signature not found' })

    // If ALL signatures on this doc are signed → mark doc signed
    const allSigs = await Signature.find({ documentId: sig.documentId })
    const allSigned = allSigs.every(s => s.status === 'signed')
    if (allSigned) {
      await Document.findByIdAndUpdate(sig.documentId, { status: 'signed' })
    }

    await logAction({
      documentId: sig.documentId,
      action: 'signed',
      actor: sig.signerEmail,
      details: allSigned ? 'All signatures complete — document fully signed' : 'Signature accepted',
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
    })

    res.json({ message: 'Document signed', signature: sig, fullySignd: allSigned })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── PATCH /api/signatures/:id/reject ─── signer rejects (Day 11)
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

    await logAction({
      documentId: sig.documentId,
      action: 'rejected',
      actor: sig.signerEmail,
      details: `Rejected with reason: ${rejectionReason || 'none'}`,
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
    })

    res.json({ message: 'Signature rejected', signature: sig })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── POST /api/signatures/finalize ─── generate signed PDF (Day 8)
export const finalizePDF = async (req, res) => {
  try {
    const { docId } = req.body

    const doc = await Document.findOne({ _id: docId, owner: req.userId })
    if (!doc) return res.status(404).json({ message: 'Document not found' })

    const signatures = await Signature.find({ documentId: docId })
    if (signatures.length === 0) {
      return res.status(400).json({ message: 'No signature fields found on this document' })
    }

    const signedUrl = await generateSignedPDF(doc, signatures)

    await Document.findByIdAndUpdate(docId, { signedFileUrl: signedUrl, status: 'signed' })

    await logAction({
      documentId: docId,
      action: 'pdf_generated',
      actor: req.userId,
      details: 'Signed PDF generated and uploaded',
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
    })

    res.json({ message: 'Signed PDF generated successfully', signedFileUrl: signedUrl })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}