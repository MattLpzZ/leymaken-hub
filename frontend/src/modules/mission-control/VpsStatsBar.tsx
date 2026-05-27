import { useEffect } from 'react'
import { useInfraStore } from '@/stores/infraStore'
import { RefreshCw } from 'lucide-react'

function Ring({ pct, color, size = 40 }: { pct: number; color: string; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

function Metric({ label, value, sub, pct, color }: { label: string; value: string; sub?: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded flex-1" style={{ background: 'var(--surface-2)' }}>
      <Ring pct={pct} color={color} />
      <div className="min-w-0">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</p>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{value}</p>
        {sub && <p className="text-xs" style={{ color: 'var(--text-3)' }}>{sub}</p>}
      </div>
    </div>
  )
}

export function VpsStatsBar() {
  const { vpsStats, loading, fetchVps } = useInfraStore()

  useEffect(() => {
    fetchVps()
    const id = setInterval(fetchVps, 30000)
    return () => clearInterval(id)
  }, [])

  const cpuColor  = (pct: number) => pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981'
  const ramColor  = (pct: number) => pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#6366f1'
  const diskColor = (pct: number) => pct > 85 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#0ea5e9'

  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      <div className="flex items-center gap-2 flex-1">
        {vpsStats ? (
          <>
            <Metric
              label="CPU"
              value={`${vpsStats.cpu_pct}%`}
              sub={`load ${vpsStats.load.m1}`}
              pct={vpsStats.cpu_pct}
              color={cpuColor(vpsStats.cpu_pct)}
            />
            <Metric
              label="RAM"
              value={`${vpsStats.ram.pct}%`}
              sub={`${vpsStats.ram.used_mb.toFixed(0)}/${vpsStats.ram.total_mb.toFixed(0)} MB`}
              pct={vpsStats.ram.pct}
              color={ramColor(vpsStats.ram.pct)}
            />
            <Metric
              label="Disk"
              value={`${vpsStats.disk.pct}%`}
              sub={`${vpsStats.disk.used_gb}/${vpsStats.disk.total_gb} GB`}
              pct={vpsStats.disk.pct}
              color={diskColor(vpsStats.disk.pct)}
            />
            <div className="flex items-center gap-4 px-4 py-2 rounded" style={{ background: 'var(--surface-2)' }}>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Load avg</p>
                <p className="text-sm font-mono" style={{ color: 'var(--text-1)' }}>
                  {vpsStats.load.m1} · {vpsStats.load.m5} · {vpsStats.load.m15}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Uptime</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{vpsStats.uptime}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 px-4 py-2 rounded text-sm" style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>
            {loading.vps ? 'Cargando métricas VPS...' : 'Sin datos de VPS'}
          </div>
        )}
      </div>
      <button className="btn-secondary text-xs flex items-center gap-1 flex-shrink-0" onClick={fetchVps}>
        <RefreshCw size={12} className={loading.vps ? 'animate-spin' : ''} />
      </button>
    </div>
  )
}
