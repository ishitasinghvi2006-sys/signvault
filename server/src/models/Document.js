import mongoose from 'mongoose'

const documentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'signed', 'rejected'],
    default: 'draft'
  },
  signerEmail: {
    type: String,
    default: ''
  },
  signedFileUrl: {
    type: String,
    default: ''
  }
}, { timestamps: true })

export default mongoose.model('Document', documentSchema);