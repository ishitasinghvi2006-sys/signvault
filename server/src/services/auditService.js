import AuditLog from '../models/AuditLog.js'

export const logAction = async ({ documentId, action, actor, details = '', ipAddress = '' }) => {
  try {
    await AuditLog.create({ documentId, action, actor, details, ipAddress })
  } catch (err) {
    console.error('Audit log error:', err.message)
  }
}

export const getAuditTrail = async (req, res) => {
  try {
    const { docId } = req.params
    const logs = await AuditLog.find({ documentId: docId })
      .sort({ createdAt: -1 })
      .populate('documentId', 'title owner')

    res.json(logs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}