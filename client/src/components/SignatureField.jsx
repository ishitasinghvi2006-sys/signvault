// @ts-nocheck
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

export function DraggableField({ id, x, y, signerEmail, status, containerWidth, containerHeight }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })

  const style = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 10,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    touchAction: 'none',
  }

  const colorMap = {
    pending: { border: '#f59e0b', bg: '#fffbeb', text: '#92400e', label: '⏳ Pending' },
    signed:  { border: '#10b981', bg: '#ecfdf5', text: '#065f46', label: '✅ Signed' },
    rejected:{ border: '#ef4444', bg: '#fef2f2', text: '#991b1b', label: '❌ Rejected' },
  }
  const c = colorMap[status] || colorMap.pending

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div style={{
        border: `2px dashed ${c.border}`,
        background: c.bg,
        borderRadius: '6px',
        padding: '6px 12px',
        minWidth: '160px',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
      }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: c.text }}>✍️ Signature Field</div>
        <div style={{ fontSize: '10px', color: c.text, opacity: 0.8, marginTop: '2px' }}>{signerEmail}</div>
        <div style={{ fontSize: '9px', color: c.text, opacity: 0.6, marginTop: '2px' }}>{c.label}</div>
      </div>
    </div>
  )
}