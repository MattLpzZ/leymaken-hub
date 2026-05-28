import { useEffect, useRef, useState } from 'react'
import { Activity, Circle } from 'lucide-react'
import api from '@/lib/bizApi'

interface LogEntry {
  id: number
  level: 'info' | 'warning' | 'error' | 'success'
  module: string
  message: string
  time: string
}

const levelColor: Record<string, string> = {
  info:    'text-blue-400',
  warning: 'text-amber-400',
  error:   'text-red-400',
  success: 'text-emerald-400',
}

const levelDot: Record<string, string> = {
  info:    'bg-blue-400',
  warning: 'bg-amber-400',
  error:   'bg-red-400',
  success: 'bg-emerald-400',
}

export function ActivityTicker() {
  const [logs, setLogs]           = useState<LogEntry[]>([])
  const [paused, setPaused]       = useState(false)
  const [connected, setConnected] = useState(false)
  const scrollRef                 = useRef<HTMLDivElement>(null)
  const eventSourceRef            = useRef<EventSource | null>(null)

  // Load recent logs on mount
  useEffect(() => {
    api.get('/activity/recent').then(({ data }) => {
      setLogs(Array.isArray(data) ? data.slice(0, 30) : [])
    }).catch(() => {})
  }, [])

  // SSE connection
  useEffect(() => {
    const token = localStorage.getItem('biz_token')
    if (!token) return

    const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
    const url = `${baseUrl}/activity/stream`

    const connect = () => {
      const es = new EventSource(url)
      eventSourceRef.current = es

      es.onopen = () => setConnected(true)
      es.onmessage = (e) => {
        try {
          const entry: LogEntry = JSON.parse(e.data)
          setLogs(prev => [entry, ...prev].slice(0, 50))
        } catch {}
      }
      es.onerror = () => {
        setConnected(false)
        es.close()
        setTimeout(connect, 5000)
      }
    }

    connect()
    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  // Auto-scroll ticker
  useEffect(() => {
    if (paused || !scrollRef.current || logs.length === 0) return
    const el = scrollRef.current
    let pos = 0
    const speed = 0.4

    const frame = setInterval(() => {
      pos += speed
      if (pos >= el.scrollWidth / 2) pos = 0
      el.scrollLeft = pos
    }, 16)

    return () => clearInterval(frame)
  }, [paused, logs])

  const items = [...logs, ...logs] // duplicate for infinite scroll effect

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 h-8 flex items-center border-t"
      style={{ backgroundColor: 'rgba(3,7,18,0.95)', borderColor: 'var(--border)', backdropFilter: 'blur(8px)' }}
    >
      {/* Left label */}
      <div
        className="flex items-center gap-1.5 px-3 flex-shrink-0 border-r h-full"
        style={{ borderColor: 'var(--border)' }}
      >
        <Activity size={11} className="text-emerald-400" />
        <span className="text-[10px] font-semibold tracking-widest uppercase text-emerald-400">Live</span>
        <span
          className={`w-1.5 h-1.5 rounded-full ml-0.5 ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`}
        />
      </div>

      {/* Scrolling content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-hidden flex items-center"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex items-center gap-0 whitespace-nowrap">
          {items.length === 0 ? (
            <span className="text-[11px] px-4" style={{ color: 'var(--text-3)' }}>
              Sin actividad reciente — el hub está en línea
            </span>
          ) : items.map((log, i) => (
            <span key={`${log.id}-${i}`} className="flex items-center gap-2 px-4">
              <Circle size={5} className={`flex-shrink-0 ${levelDot[log.level] ?? 'bg-gray-500'} fill-current`} />
              <span className={`text-[10px] font-medium ${levelColor[log.level] ?? 'text-gray-400'}`}>
                [{log.module}]
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-2)' }}>{log.message}</span>
              <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>{log.time}</span>
              <span className="text-gray-700 ml-2">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
