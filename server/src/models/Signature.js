import mongoose from 'mongoose'

const signatureSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  signerEmail: {
    type: String,
    required: true
  },
  // Position on the PDF page (percentage-based 0-100)
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  page: { type: Number, default: 1 },
  width: { type: Number, default: 200 },
  height: { type: Number, default: 60 },
  status: {
    type: String,
    enum: ['pending', 'signed', 'rejected'],
    default: 'pending'
  },
  signedAt: { type: Date },
  rejectionReason: { type: String, default: '' },
  signatureData: { type: String, default: '' }
}, { timestamps: true })

export default mongoose.model('Signature', signatureSchema);