import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const statusConfig = {
  draft:    { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400'   },
  pending:  { bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-400'  },
  signed:   { bg: 'bg-emerald-50', text: 'text-emerald-700',dot: 'bg-emerald-400'},
  rejected: { bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-400'    },
}

export default function Dashboard() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/docs').then(r => setDocs(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? docs : docs.filter(d => d.status === filter)
  const counts = {
    all: docs.length,
    draft: docs.filter(d => d.status === 'draft').length,
    pending: docs.filter(d => d.status === 'pending').length,
    signed: docs.filter(d => d.status === 'signed').length,
    rejected: docs.filter(d => d.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <span className="font-semibold text-gray-900">SignVault</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
            <button onClick={() => { logout(); navigate('/') }}
              className="text-sm text-gray-400 hover:text-gray-700 transition">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage and track your signed documents</p>
          </div>
          <Link to="/upload"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm">
            + Upload Document
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', count: counts.all, color: 'text-gray-900', bg: 'bg-white' },
            { label: 'Pending', count: counts.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Signed', count: counts.signed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Rejected', count: counts.rejected, color: 'text-red-600', bg: 'bg-red-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl border border-gray-100 p-5`}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.count}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
          {['all', 'draft', 'pending', 'signed', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>{f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="text-4xl mb-3">📄</div>
            <p className="text-gray-400 font-medium">No documents yet</p>
            <Link to="/upload" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
              Upload your first document →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Document', 'Signer', 'Status', 'Uploaded'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc, i) => {
                  const s = statusConfig[doc.status] || statusConfig.draft
                  return (
                    // Add onClick to navigate to DocViewer when clicking a row:
                  <tr key={doc._id}
                      onClick={() => navigate(`/docs/${doc._id}`)}
                      className={`border-b ... cursor-pointer hover:bg-blue-50`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 text-xs font-bold">PDF</div>
                          <span className="font-medium text-gray-900 text-sm">{doc.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{doc.signerEmail || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}