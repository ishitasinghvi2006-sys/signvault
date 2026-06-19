// @ts-nocheck
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'


export default function SignPage() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [reason, setReason] = useState('')
  const [done, setDone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    axios.get(`${BASE}/signing/${token}`)
      .then(r => setData(r.data))
      .catch(() => setError('This signing link is invalid or has expired.'))
      .finally(() => setLoading(false))
  }, [token])

  const handleSign = async (sigId, accept) => {
    setSubmitting(true)
    try {
      const endpoint = accept ? `/signatures/${sigId}/sign` : `/signatures/${sigId}/reject`
      await axios.patch(`${BASE}${endpoint}`, { rejectionReason: reason })
      setDone(accept ? 'signed' : 'rejected')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">Verifying signing link...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border p-8 max-w-md text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Link Invalid</h2>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  )

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border p-8 max-w-md text-center">
        <div className="text-5xl mb-4">{done === 'signed' ? '✅' : '❌'}</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Document {done === 'signed' ? 'Signed!' : 'Rejected'}
        </h2>
        <p className="text-gray-500 text-sm">
          {done === 'signed'
            ? 'Thank you. The document owner has been notified.'
            : 'Your rejection has been recorded.'}
        </p>
      </div>
    </div>
  )

  const { document: doc, signatures, signerEmail } = data

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <span className="font-semibold text-gray-900">SignVault</span>
          </div>
          <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
            🔒 Secure Signing Session
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 font-mono uppercase mb-1">Document to sign</p>
              <h1 className="text-xl font-bold text-gray-900">{doc.title}</h1>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
              Awaiting Signature
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Signing as:</span>
            <span className="font-medium text-gray-900">{signerEmail}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <iframe
            src={doc.fileUrl}
            className="w-full h-96 border-0"
            title="Document preview"
          />
        </div>

        {signatures.map(sig => (
          <div key={sig._id} className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
            <h3 className="font-semibold text-gray-900 mb-4">Signature Field #{sig._id.slice(-6)}</h3>

            {sig.status !== 'pending' ? (
              <div className={`text-center py-4 rounded-xl ${
                sig.status === 'signed' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}>
                {sig.status === 'signed' ? '✅ Already signed' : '❌ Already rejected'}
              </div>
            ) : (
              <div>
                {action === 'reject' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for rejection (optional)
                    </label>
                    <textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      rows={3}
                      placeholder="e.g. Terms need revision in Section 3..."
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setAction('reject'); }}
                    className="flex-1 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition"
                  >
                    ✗ Decline
                  </button>
                  <button
                    onClick={() => handleSign(sig._id, action !== 'reject')}
                    disabled={submitting}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                      action === 'reject'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {submitting ? 'Processing...' : action === 'reject' ? 'Confirm Reject' : '✓ Sign Document'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  )
}