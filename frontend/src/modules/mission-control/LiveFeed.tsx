import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface FeedEvent { source: string; message: string; timestamp: string }

const sourceColor: Record<string, string> = {
  docker: '#10b981', github: '#6366f1', cloudflare: '#f59e0b',
}

export function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([])

  useEffect(() => {
    api.get('/infra/feed').then(r => setEvents(r.data.events ?? []))
    const interval = setInterval(() => {
      api.get('/infra/feed').then(r => setEvents(r.data.events ?? []))
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="card">
      <h2 className="font-semibold text-xs mb-2" style={{ color: 'var(--text-3)' }}>Live Feed</h2>
      {events.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin eventos recientes</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {events.slice(0, 20).map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 rounded flex-shrink-0 text-xs"
              style={{ background: 'var(--surface-2)', borderLeft: `2px solid ${sourceColor[e.source] ?? 'var(--text-3)'}` }}
            >
              <span style={{ color: 'var(--text-2)' }}>{e.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
