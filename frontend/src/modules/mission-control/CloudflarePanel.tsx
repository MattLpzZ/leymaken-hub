import { useState, useEffect } from 'react'
import { useInfraStore } from '@/stores/infraStore'
import { Globe, Zap, ChevronRight } from 'lucide-react'

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function CloudflarePanel() {
  const { zones, workers, loading, fetchCloudflare } = useInfraStore()
  const [showWorkers, setShowWorkers] = useState(false)

  useEffect(() => { fetchCloudflare() }, [])

  return (
    <div className="card h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Cloudflare</h2>
        <div className="flex gap-2">
          <span className="badge badge-gray">{zones.length} zones</span>
          <span className="badge badge-gray">{workers.length} workers</span>
        </div>
      </div>

      {loading.cloudflare && !zones.length ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Cargando...</p>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-0.5">
          {zones.map(z => (
            <div key={z.id} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--surface-2)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <Globe size={12} className="flex-shrink-0" style={{ color: 'var(--text-3)' }} />
                <span className="text-sm truncate" style={{ color: 'var(--text-1)' }}>{z.name}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                {z.analytics && (
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {formatNum(z.analytics.requests)} req/24h
                  </span>
                )}
                <span className={`badge ${z.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>{z.status}</span>
              </div>
            </div>
          ))}

          {workers.length > 0 && (
            <>
              <button
                className="w-full flex items-center gap-1 py-1 text-xs"
                style={{ color: 'var(--text-3)' }}
                onClick={() => setShowWorkers(s => !s)}
              >
                <ChevronRight
                  size={12}
                  style={{ transform: showWorkers ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
                />
                Workers & Pages ({workers.length})
              </button>
              {showWorkers && workers.map(w => (
                <div key={w.id} className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: 'var(--surface-2)' }}>
                  <Zap size={10} style={{ color: 'var(--text-3)' }} />
                  <span className="text-xs font-mono" style={{ color: 'var(--text-2)' }}>{w.id}</span>
                </div>
              ))}
            </>
          )}

          {!zones.length && <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin zonas</p>}
        </div>
      )}
    </div>
  )
}
