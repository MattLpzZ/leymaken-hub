import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface FeedEvent { source: string; message: string; timestamp: string }

export function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([])

  useEffect(() => {
    api.get('/infra/feed').then(r => setEvents(r.data.events ?? []))
    const interval = setInterval(() => {
      api.get('/infra/feed').then(r => setEvents(r.data.events ?? []))
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const sourceColor: Record<string, string> = {
    docker: '#10b981', github: '#6366f1', cloudflare: '#f59e0b',
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-1)' }}>Live Feed</h2>
      {events.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin eventos recientes</p>
      ) : (
        <div className="space-y-2">
          {events.slice(0, 20).map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: sourceColor[e.source] ?? 'var(--text-3)' }} />
              <span style={{ color: 'var(--text-2)' }}>{e.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
