import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  action: { type: String, required: true }, // e.g. 'uploaded', 'field_placed', 'signed', 'rejected', 'pdf_generated', 'link_sent'
  actor: { type: String, required: true }, // email of who did it
  details: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('AuditLog', auditLogSchema)