import { useEffect } from 'react'
import { useInfraStore } from '@/stores/infraStore'
import { RefreshCw } from 'lucide-react'

export function InfraOverview() {
  const { containers, loading, fetchDocker, restartContainer } = useInfraStore()

  useEffect(() => { fetchDocker() }, [])

  const stateColor = (state: string) =>
    state === 'running' ? 'badge-green' : state === 'exited' ? 'badge-red' : 'badge-yellow'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Docker — VPS</h2>
        <button className="btn-secondary text-xs flex items-center gap-1" onClick={fetchDocker}>
          <RefreshCw size={12} className={loading.docker ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading.docker && !containers.length ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Cargando...</p>
      ) : (
        <div className="space-y-2">
          {containers.map(c => (
            <div key={c.id} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--surface-2)' }}>
              <div>
                <span className="text-sm font-mono" style={{ color: 'var(--text-1)' }}>{c.name}</span>
                <span className="text-xs ml-2" style={{ color: 'var(--text-3)' }}>{c.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${stateColor(c.state)}`}>{c.state}</span>
                {c.state !== 'running' && (
                  <button className="btn-secondary text-xs" onClick={() => restartContainer(c.name)}>
                    Reiniciar
                  </button>
                )}
              </div>
            </div>
          ))}
          {!containers.length && <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin containers</p>}
        </div>
      )}
    </div>
  )
}
