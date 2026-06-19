import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import Document from '../models/Document.js'
import Signature from '../models/Signature.js'
import { logAction } from '../services/auditService.js'

// ─── POST /api/signing/send ─── generate token + email signer
export const sendSigningLink = async (req, res) => {
  try {
    const { docId } = req.body

    const doc = await Document.findOne({ _id: docId, owner: req.userId })
    if (!doc) return res.status(404).json({ message: 'Document not found' })
    if (!doc.signerEmail) return res.status(400).json({ message: 'No signer email on this document' })

    const token = jwt.sign(
      { docId: doc._id, signerEmail: doc.signerEmail },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    const signingUrl = `${process.env.CLIENT_URL}/sign/${token}`

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: `"SignVault" <${process.env.SMTP_USER}>`,
      to: doc.signerEmail,
      subject: `Please sign: ${doc.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#1e40af">✏️ You have a document to sign</h2>
          <p>You've been requested to sign <strong>${doc.title}</strong></p>
          <p>This link expires in <strong>7 days</strong>.</p>
          <a href="${signingUrl}"
            style="display:inline-block;margin:20px 0;padding:12px 24px;
            background:#1e40af;color:white;text-decoration:none;
            border-radius:8px;font-weight:bold">
            Sign Document →
          </a>
          <p style="color:#888;font-size:12px">Powered by SignVault</p>
        </div>
      `
    })

    await logAction({
      documentId: docId,
      action: 'link_sent',
      actor: req.userId,
      details: `Signing link sent to ${doc.signerEmail}`,
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
    })

    res.json({ message: 'Signing link sent!', signingUrl, sentTo: doc.signerEmail })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── GET /api/signing/:token ─── verify token, return doc + signatures (Day 13)
export const getSigningPage = async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET)
    const { docId, signerEmail } = decoded

    const doc = await Document.findById(docId)
    if (!doc) return res.status(404).json({ message: 'Document not found' })

    // Check doc isn't already rejected
    if (doc.status === 'rejected') {
      return res.status(400).json({ message: 'This document has been rejected and cannot be signed' })
    }

    const signatures = await Signature.find({ documentId: docId, signerEmail })

    await logAction({
      documentId: docId,
      action: 'viewed',
      actor: signerEmail,
      details: 'Signer opened the signing page',
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
    })

    res.json({ document: doc, signatures, signerEmail })
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired signing link' })
  }
}

// ─── POST /api/signing/:token/sign ─── signer submits (Day 13)
export const submitSignature = async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET)
    const { docId, signerEmail } = decoded

    const { signatureData, signatureId } = req.body

    const sig = await Signature.findOneAndUpdate(
      { _id: signatureId, documentId: docId, signerEmail },
      { status: 'signed', signedAt: new Date(), signatureData },
      { new: true }
    )
    if (!sig) return res.status(404).json({ message: 'Signature field not found' })

    // Check if all signatures done
    const allSigs = await Signature.find({ documentId: docId })
    const allSigned = allSigs.every(s => s.status === 'signed')
    if (allSigned) {
      await Document.findByIdAndUpdate(docId, { status: 'signed' })
    }

    await logAction({
      documentId: docId,
      action: 'signed',
      actor: signerEmail,
      details: allSigned ? 'All signatures complete' : 'Partial signature submitted',
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
    })

    res.json({ message: 'Signature submitted', fullySignd: allSigned })
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired signing link' })
  }
}

// ─── POST /api/signing/:token/reject ─── signer rejects (Day 13)
export const submitRejection = async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET)
    const { docId, signerEmail } = decoded

    const { reason } = req.body

    await Signature.updateMany(
      { documentId: docId, signerEmail },
      { status: 'rejected', rejectionReason: reason || '' }
    )
    await Document.findByIdAndUpdate(docId, { status: 'rejected' })

    await logAction({
      documentId: docId,
      action: 'rejected',
      actor: signerEmail,
      details: `Rejected: ${reason || 'No reason given'}`,
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
    })

    res.json({ message: 'Document rejected' })
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired signing link' })
  }
}