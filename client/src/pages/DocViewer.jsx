// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { DraggableField } from '../components/SignatureField'
import api from '../api/axios'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function DocViewer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const pdfRef = useRef(null)
  const [doc, setDoc] = useState(null)
  const [signatures, setSignatures] = useState([])
  const [numPages, setNumPages] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [placing, setPlacing] = useState(false)
  const [pending, setPending] = useState(null)
  const [signerEmail, setSignerEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [pdfWidth, setPdfWidth] = useState(700)
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    api.get(`/docs/${id}`).then(r => {
      setDoc(r.data)
      setSignerEmail(r.data.signerEmail || '')
    }).catch(() => navigate('/dashboard'))
    api.get(`/signatures/${id}`).then(r => setSignatures(r.data))
  }, [id])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const handlePdfClick = useCallback((e) => {
    if (!placing || !pdfRef.current) return
    const rect = pdfRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPending({ x: Math.max(0, Math.min(85, x)), y: Math.max(0, Math.min(92, y)), page: currentPage })
    setPlacing(false)
  }, [placing, currentPage])

  const handleDragEnd = useCallback(({ active, delta }) => {
    setActiveId(null)
    if (!pdfRef.current) return
    const rect = pdfRef.current.getBoundingClientRect()
    const dxPct = (delta.x / rect.width) * 100
    const dyPct = (delta.y / rect.height) * 100
    setSignatures(prev => prev.map(s => {
      if (s._id !== active.id) return s
      return {
        ...s,
        x: Math.max(0, Math.min(85, s.x + dxPct)),
        y: Math.max(0, Math.min(92, s.y + dyPct)),
      }
    }))
  }, [])

  const saveSignature = async () => {
    if (!pending || !signerEmail) {
      showToast('⚠️ Add a signer email first')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.post('/signatures', {
        documentId: id, signerEmail,
        x: pending.x, y: pending.y, page: pending.page,
      })
      setSignatures(prev => [...prev, data.signature])
      setPending(null)
      showToast('✅ Signature field saved! Document status → pending')
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.message || 'Save failed'))
    } finally { setSaving(false) }
  }

  if (!doc) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400 text-sm">Loading document...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition">
            ← Back
          </button>
          <div className="h-4 w-px bg-gray-200"></div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">{doc.title}</h1>
          </div>
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
            {doc.status}
          </span>
          <div className="flex items-center gap-2">
            <input value={signerEmail} onChange={e => setSignerEmail(e.target.value)}
              placeholder="signer@email.com"
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={() => { setPlacing(true); setPending(null) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                placing
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
              {placing ? '📍 Click to place...' : '+ Place Field'}
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-xl">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            {signatures.length} signature field{signatures.length !== 1 ? 's' : ''} placed
          </div>
          {numPages && numPages > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-40">←</button>
              <span className="text-sm text-gray-600">Page {currentPage} / {numPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                disabled={currentPage === numPages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-40">→</button>
            </div>
          )}
        </div>

        <DndContext
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={handleDragEnd}
        >
          <div
            ref={pdfRef}
            onClick={handlePdfClick}
            className={`relative bg-white shadow-xl rounded-lg overflow-hidden select-none ${
              placing ? 'cursor-crosshair ring-2 ring-amber-400' : 'cursor-default'
            }`}
          >
            {placing && (
              <div className="absolute inset-0 bg-amber-400/10 z-10 flex items-center justify-center pointer-events-none">
                <div className="bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow">
                  Click anywhere on the PDF to place the signature field
                </div>
              </div>
            )}

            <Document
              file={doc.fileUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              className="w-full"
              loading={
                <div className="h-96 flex items-center justify-center text-gray-400">Loading PDF...</div>
              }
            >
              <Page
                pageNumber={currentPage}
                width={pdfWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onRenderSuccess={() => {
                  if (pdfRef.current) setPdfWidth(pdfRef.current.offsetWidth)
                }}
              />
            </Document>

            {signatures
              .filter(s => s.page === currentPage || !s.page)
              .map(sig => (
                <DraggableField
                  key={sig._id}
                  id={sig._id}
                  x={sig.x}
                  y={sig.y}
                  signerEmail={sig.signerEmail}
                  status={sig.status}
                />
              ))
            }

            {pending && (
              <div
                style={{
                  position: 'absolute',
                  left: `${pending.x}%`,
                  top: `${pending.y}%`,
                  zIndex: 20,
                }}
                className="pointer-events-none"
              >
                <div className="border-2 border-dashed border-blue-500 bg-blue-50/90 rounded-lg px-3 py-2 shadow-lg">
                  <div className="text-xs font-semibold text-blue-700">✍️ New signature field</div>
                  <div className="text-xs text-blue-500 mt-0.5">{signerEmail || 'add signer email above'}</div>
                </div>
              </div>
            )}
          </div>
        </DndContext>

        {pending && (
          <div className="mt-4 flex items-center justify-end gap-3 bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 flex-1">
              Field placed at ({pending.x.toFixed(1)}%, {pending.y.toFixed(1)}%) on page {pending.page}
            </p>
            <button onClick={() => setPending(null)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={saveSignature} disabled={saving || !signerEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
              {saving ? 'Saving...' : 'Save Signature Field'}
            </button>
          </div>
        )}

        {signatures.length > 0 && (
          <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Signature Fields</h3>
            </div>
            {signatures.map((sig, i) => (
              <div key={sig._id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400 font-mono">#{i + 1}</span>
                <span className="text-sm text-gray-700 flex-1">{sig.signerEmail}</span>
                <span className="text-xs text-gray-400">
                  Page {sig.page || 1} · ({sig.x?.toFixed(1)}%, {sig.y?.toFixed(1)}%)
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  sig.status === 'signed' ? 'bg-emerald-100 text-emerald-700'
                  : sig.status === 'rejected' ? 'bg-red-100 text-red-600'
                  : 'bg-amber-100 text-amber-700'
                }`}>
                  {sig.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}