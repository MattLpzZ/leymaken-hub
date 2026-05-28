import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react'
import api from '@/lib/bizApi'

type ServiceStatus = 'ok' | 'degraded' | 'down' | 'checking'

interface ServiceCheck {
  id: string
  label: string
  url: string
  category: string
  status: ServiceStatus
  latency: number | null
  lastChecked: Date | null
  error?: string
}

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const SERVICES_CONFIG: Omit<ServiceCheck, 'status' | 'latency' | 'lastChecked' | 'error'>[] = [
  { id: 'api',           label: 'Core API',          url: `${BASE_URL}/api/ping`,            category: 'Backend' },
  { id: 'queue',         label: 'Queue Worker',       url: `${BASE_URL}/api/ping/queue`,      category: 'Backend' },
  { id: 'db',            label: 'Base de datos',      url: `${BASE_URL}/api/ping/db`,         category: 'Backend' },
  { id: 'infra_metrics', label: 'VPS Metrics',        url: `${BASE_URL}/api/infra/metrics`,   category: 'Backend' },
  { id: 'os_frontend',   label: 'OS Panel',           url: `${window.location.origin}/`,      category: 'Frontend' },
  { id: 'commerce',      label: 'Commerce ERP',       url: 'https://leymaken.com',            category: 'Frontend' },
  { id: 'n8n',           label: 'n8n Automation',     url: 'https://n8n.leymaken.com',        category: 'Servicios' },
  { id: 'evolution',     label: 'Evolution API',      url: 'https://evolution.leymaken.com',  category: 'Servicios' },
  { id: 'ollama',        label: 'Ollama AI',          url: `${BASE_URL}/api/ping/ollama`,     category: 'Servicios' },
]

async function checkService(svc: typeof SERVICES_CONFIG[number]): Promise<ServiceCheck> {
  const start = Date.now()
  try {
    if (svc.url.startsWith(BASE_URL + '/api')) {
      await api.get(svc.url.replace(BASE_URL + '/api', ''), { timeout: 8000 } as any)
    } else {
      await fetch(svc.url, { method: 'HEAD', mode: 'no-cors', signal: AbortSignal.timeout(8000) })
    }
    const latency = Date.now() - start
    return {
      ...svc,
      status: latency > 3000 ? 'degraded' : 'ok',
      latency,
      lastChecked: new Date(),
    }
  } catch (err: any) {
    return {
      ...svc,
      status: 'down',
      latency: null,
      lastChecked: new Date(),
      error: err?.message ?? 'Sin respuesta',
    }
  }
}

function StatusIcon({ status }: { status: ServiceStatus }) {
  if (status === 'checking') return <RefreshCw size={15} className="animate-spin text-gray-500" />
  if (status === 'ok')       return <CheckCircle2 size={15} className="text-emerald-400" />
  if (status === 'degraded') return <AlertCircle size={15} className="text-amber-400" />
  return <XCircle size={15} className="text-red-400" />
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const classes: Record<ServiceStatus, string> = {
    ok:       'badge badge-green',
    degraded: 'badge badge-amber',
    down:     'badge badge-red',
    checking: 'badge badge-gray',
  }
  const labels: Record<ServiceStatus, string> = {
    ok: 'OK', degraded: 'Lento', down: 'Caído', checking: '...',
  }
  return <span className={classes[status]}>{labels[status]}</span>
}

function LatencyBar({ latency }: { latency: number | null }) {
  if (latency === null) return <span className="text-xs text-gray-600">—</span>
  const color = latency < 300 ? 'text-emerald-400' : latency < 1000 ? 'text-amber-400' : 'text-red-400'
  return <span className={`text-xs font-mono ${color}`}>{latency}ms</span>
}

function SummaryBar({ services }: { services: ServiceCheck[] }) {
  const checked = services.filter(s => s.status !== 'checking')
  const ok      = checked.filter(s => s.status === 'ok').length
  const issues  = checked.filter(s => s.status !== 'ok').length

  if (checked.length === 0) return null

  return (
    <div className={`card-sm flex items-center gap-4 ${issues === 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${issues === 0 ? 'bg-emerald-400' : 'bg-red-400'} ${issues === 0 ? 'shadow-[0_0_8px_2px_rgba(52,211,153,0.4)]' : 'shadow-[0_0_8px_2px_rgba(248,113,113,0.4)]'}`} />
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
          {issues === 0 ? 'Todos los sistemas operativos' : `${issues} servicio${issues > 1 ? 's' : ''} con problemas`}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
          {ok}/{checked.length} servicios OK
        </p>
      </div>
    </div>
  )
}

const INIT: ServiceCheck[] = SERVICES_CONFIG.map(s => ({
  ...s, status: 'checking', latency: null, lastChecked: null,
}))

export default function StatusPage() {
  const [services, setServices] = useState<ServiceCheck[]>(INIT)
  const [checking, setChecking] = useState(false)
  const [lastRun, setLastRun]   = useState<Date | null>(null)

  const runChecks = useCallback(async () => {
    setChecking(true)
    setServices(SERVICES_CONFIG.map(s => ({ ...s, status: 'checking', latency: null, lastChecked: null })))
    const results = await Promise.all(SERVICES_CONFIG.map(checkService))
    setServices(results)
    setLastRun(new Date())
    setChecking(false)
  }, [])

  useEffect(() => {
    runChecks()
    const interval = setInterval(runChecks, 60_000)
    return () => clearInterval(interval)
  }, [runChecks])

  const categories = [...new Set(SERVICES_CONFIG.map(s => s.category))]

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>System Status</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            {lastRun
              ? `Último chequeo: ${lastRun.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Verificando servicios...'}
          </p>
        </div>
        <button
          onClick={runChecks}
          disabled={checking}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw size={13} className={checking ? 'animate-spin' : ''} />
          Verificar ahora
        </button>
      </div>

      <SummaryBar services={services} />

      {categories.map(cat => {
        const catServices = services.filter(s => s.category === cat)
        return (
          <div key={cat} className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">{cat}</p>
            <div className="card overflow-hidden p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="table-header text-left px-4 py-3">Servicio</th>
                    <th className="table-header text-left px-4 py-3 hidden sm:table-cell">URL</th>
                    <th className="table-header text-right px-4 py-3 hidden md:table-cell">Latencia</th>
                    <th className="table-header text-right px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {catServices.map(svc => (
                    <tr key={svc.id} className="table-row border-b border-gray-800 last:border-0">
                      <td className="table-cell px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={svc.status} />
                          <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{svc.label}</span>
                        </div>
                        {svc.error && (
                          <p className="text-[10px] text-red-400 mt-0.5 ml-6 font-mono truncate max-w-[200px]">{svc.error}</p>
                        )}
                      </td>
                      <td className="table-cell px-4 py-3 hidden sm:table-cell">
                        <a
                          href={svc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-mono hover:text-emerald-400 transition-colors truncate max-w-[240px]"
                          style={{ color: 'var(--text-3)' }}
                        >
                          <ExternalLink size={10} />
                          {svc.url.replace(/^https?:\/\//, '').split('/')[0]}
                        </a>
                      </td>
                      <td className="table-cell px-4 py-3 text-right hidden md:table-cell">
                        <LatencyBar latency={svc.latency} />
                      </td>
                      <td className="table-cell px-4 py-3 text-right">
                        <StatusBadge status={svc.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
        <Clock size={11} />
        Se actualiza automáticamente cada 60 segundos
      </div>
    </div>
  )
}
