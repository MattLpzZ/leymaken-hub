import { useEffect } from 'react'
import { useInfraStore } from '@/stores/infraStore'
import { Globe, Zap } from 'lucide-react'

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n/1000).toFixed(1)}K`
  return String(n)
}

export function CloudflarePanel() {
  const { zones, workers, loading, fetchCloudflare } = useInfraStore()
  useEffect(() => { fetchCloudflare() }, [])

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Cloudflare</h2>
        <div className="flex gap-2">
          <span className="badge badge-gray">{zones.length} zones</span>
          <span className="badge badge-gray">{workers.length} workers</span>
        </div>
      </div>

      {loading.cloudflare && !zones.length ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Cargando...</p>
      ) : (
        <div className="space-y-3">
          {zones.map(z => (
            <div key={z.id} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--surface-2)' }}>
              <div className="flex items-center gap-2">
                <Globe size={12} style={{ color: 'var(--text-3)' }} />
                <span className="text-sm" style={{ color: 'var(--text-1)' }}>{z.name}</span>
              </div>
              <div className="flex items-center gap-3">
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
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>Workers & Pages</p>
              <div className="space-y-1">
                {workers.map(w => (
                  <div key={w.id} className="flex items-center gap-2">
                    <Zap size={10} style={{ color: 'var(--text-3)' }} />
                    <span className="text-xs font-mono" style={{ color: 'var(--text-2)' }}>{w.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!zones.length && <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin zonas</p>}
        </div>
      )}
    </div>
  )
}
