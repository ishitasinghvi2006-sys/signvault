// middleware/auditLogger.js
// Usage: attach to any route to auto-log the action
// e.g. router.post('/send', auth, auditLogger('link_sent'), sendSigningLink)

import { logAction } from '../services/auditService.js'

const auditLogger = (action) => async (req, res, next) => {
  // Intercept res.json to capture the response
  const originalJson = res.json.bind(res)

  res.json = async (data) => {
    // Only log on success (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const documentId = req.body?.docId || req.body?.documentId || req.params?.docId || data?.document?._id || data?.signature?.documentId
      const actor = req.userEmail || req.userId || req.body?.signerEmail || 'unknown'
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''

      if (documentId) {
        await logAction({ documentId, action, actor, ipAddress: ip })
      }
    }
    return originalJson(data)
  }

  next()
}

export default auditLogger