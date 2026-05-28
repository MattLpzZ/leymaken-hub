import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import api from '@/lib/api'

interface ActivityEntry {
  id: number
  type: string
  description: string
  created_at: string
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.get('/activity/recent')
      .then(r => setItems(r.data.slice(0, 12)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  const alertCount = Math.min(items.filter(i => i.type === 'error' || i.type === 'warning').length, 9)

  const dotColor = (type: string) =>
    type === 'error'   ? '#f87171' :
    type === 'warning' ? '#fbbf24' :
    '#34d399'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-1.5 rounded transition-colors hover:bg-gray-800"
        title="Notificaciones"
      >
        <Bell size={16} style={{ color: open ? 'var(--accent)' : 'var(--text-3)' }} />
        {alertCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
          >
            {alertCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Actividad reciente</p>
            {alertCount > 0 && (
              <span className="badge badge-red text-[10px]">{alertCount} alerta{alertCount !== 1 ? 's' : ''}</span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: 'var(--text-3)' }}>Sin actividad reciente</p>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-800/50 transition-colors border-b"
                  style={{ borderColor: '#1f2937' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: dotColor(item.type) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug" style={{ color: 'var(--text-1)' }}>{item.description}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                      {new Date(item.created_at).toLocaleString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
