import { useState, useEffect } from 'react'
import { useInfraStore } from '@/stores/infraStore'
import { RefreshCw, ChevronRight } from 'lucide-react'

type Container = { id: string; name: string; state: string; status: string }

function ContainerRow({ c, onRestart }: { c: Container; onRestart: () => void }) {
  const color = c.state === 'running' ? 'badge-green' : c.state === 'exited' ? 'badge-red' : 'badge-yellow'
  return (
    <div className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--surface-2)' }}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-mono truncate" style={{ color: 'var(--text-1)' }}>{c.name}</p>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{c.status}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className={`badge ${color}`}>{c.state}</span>
        {c.state !== 'running' && (
          <button className="btn-secondary text-xs" onClick={onRestart}>Reiniciar</button>
        )}
      </div>
    </div>
  )
}

export function InfraOverview() {
  const { containers, loading, fetchDocker, restartContainer } = useInfraStore()
  const [showStopped, setShowStopped] = useState(false)

  useEffect(() => { fetchDocker() }, [])

  const running = containers.filter(c => c.state === 'running')
  const stopped = containers.filter(c => c.state !== 'running')

  return (
    <div className="card h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Docker — VPS</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
            {running.length} running · {stopped.length} stopped
          </span>
          <button className="btn-secondary text-xs flex items-center gap-1" onClick={fetchDocker}>
            <RefreshCw size={12} className={loading.docker ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading.docker && !containers.length ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Cargando...</p>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-0.5">
          {running.map(c => (
            <ContainerRow key={c.id} c={c} onRestart={() => restartContainer(c.name)} />
          ))}

          {stopped.length > 0 && (
            <>
              <button
                className="w-full flex items-center gap-1 py-1 text-xs"
                style={{ color: 'var(--text-3)' }}
                onClick={() => setShowStopped(s => !s)}
              >
                <ChevronRight
                  size={12}
                  style={{ transform: showStopped ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
                />
                {stopped.length} detenidos
              </button>
              {showStopped && stopped.map(c => (
                <ContainerRow key={c.id} c={c} onRestart={() => restartContainer(c.name)} />
              ))}
            </>
          )}

          {!containers.length && <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin containers</p>}
        </div>
      )}
    </div>
  )
}
