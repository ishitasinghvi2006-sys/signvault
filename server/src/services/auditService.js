import AuditLog from '../models/AuditLog.js'

export async function logAction(documentId, action, actor, details = '') {
  try {
    await AuditLog.create({ documentId, action, actor, details })
  } catch (err) {
    console.error('Audit log failed:', err.message)
  }
}

// GET /api/audit/:docId — returns full history
export const getAuditTrail = async (req, res) => {
  try {
    const logs = await AuditLog.find({ documentId: req.params.docId }).sort({ createdAt: 1 })
    res.json(logs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}