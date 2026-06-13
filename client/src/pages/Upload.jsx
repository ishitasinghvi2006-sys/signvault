import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Upload() {
  const [title, setTitle] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')

  // Validation
  if (!title.trim()) return setError('Document title is required')
  if (title.trim().length < 3) return setError('Title must be at least 3 characters')
  if (!file) return setError('Please select a PDF file')
  if (file.type !== 'application/pdf') return setError('Only PDF files are allowed')
  if (file.size > 50 * 1024 * 1024) return setError('File size must be less than 50MB')
  if (signerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail)) {
    return setError('Please enter a valid signer email')
  }

  setLoading(true)
  try {
    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('signerEmail', signerEmail)
    formData.append('file', file)
    await api.post('/docs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    navigate('/dashboard')
  } catch (err) {
    setError(err.response?.data?.message || 'Upload failed. Check your connection.')
  } finally { setLoading(false) }
}

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Upload Document</h2>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Employment Contract" required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signer Email</label>
            <input type="email" value={signerEmail} onChange={e => setSignerEmail(e.target.value)}
              placeholder="signer@example.com"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PDF File</label>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])}
              className="w-full border rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/dashboard')}
              className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}