import { useEffect } from 'react'
import { useInfraStore } from '@/stores/infraStore'
import { Globe, ShieldCheck, ShieldOff } from 'lucide-react'

export function HestiaPanel() {
  const { domains, loading, fetchHestia } = useInfraStore()
  useEffect(() => { fetchHestia() }, [])

  const active    = domains.filter(d => !d.suspended)
  const suspended = domains.filter(d => d.suspended)

  return (
    <div className="card h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>HestiaCP — Webs</h2>
        <span className="badge badge-gray">{domains.length} dominios</span>
      </div>

      {loading.hestia && !domains.length ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Cargando...</p>
      ) : domains.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Configura HESTIA_HOST / HESTIA_PASSWORD en .env
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-0.5">
          {active.map(d => (
            <div key={d.domain} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--surface-2)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <Globe size={12} className="flex-shrink-0" style={{ color: 'var(--text-3)' }} />
                <span className="text-sm truncate font-mono" style={{ color: 'var(--text-1)' }}>{d.domain}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                {d.ssl
                  ? <ShieldCheck size={13} style={{ color: '#10b981' }} />
                  : <ShieldOff   size={13} style={{ color: '#6b7280' }} />
                }
              </div>
            </div>
          ))}

          {suspended.length > 0 && (
            <div className="pt-1">
              <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{suspended.length} suspendidos</p>
              {suspended.map(d => (
                <div key={d.domain} className="flex items-center gap-2 p-2 rounded opacity-50" style={{ background: 'var(--surface-2)' }}>
                  <Globe size={12} style={{ color: 'var(--text-3)' }} />
                  <span className="text-sm truncate font-mono" style={{ color: 'var(--text-2)' }}>{d.domain}</span>
                  <span className="badge badge-red ml-auto">suspended</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
