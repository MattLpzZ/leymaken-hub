import { useState, useEffect, useRef } from 'react'
import { Play, Square, Plus, Trash2, Loader2, X } from 'lucide-react'
import { ProjectsService, TimeEntriesService, type Project, type TimeEntry } from '@/lib/services/projects.service'

const HOURLY_RATE = 1500

const fmt = (secs: number) => {
  const h = Math.floor(secs / 3600).toString().padStart(2, '0')
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function TimeTracker() {
  const [projects, setProjects]     = useState<Project[]>([])
  const [entries, setEntries]       = useState<TimeEntry[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [running, setRunning]       = useState(false)
  const [elapsed, setElapsed]       = useState(0)
  const [startedAt, setStartedAt]   = useState<string | null>(null)
  const [selProjectId, setSelProjectId] = useState<number | ''>('')
  const [desc, setDesc]             = useState('')
  const [billable, setBillable]     = useState(true)
  const [showManual, setShowManual] = useState(false)
  const [manual, setManual]         = useState({
    project_id: '' as number | '',
    description: '',
    hours: '',
    date: new Date().toISOString().slice(0, 10),
    billable: true,
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    Promise.all([
      ProjectsService.list(),
      TimeEntriesService.list(),
    ]).then(([p, e]) => {
      setProjects(p)
      setEntries(e)
      if (p[0]) setSelProjectId(p[0].id!)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const startStop = async () => {
    if (running) {
      const hours = parseFloat((elapsed / 3600).toFixed(2))
      if (hours > 0.01 && startedAt) {
        setSaving(true)
        try {
          const entry = await TimeEntriesService.stop({
            project_id: selProjectId || undefined,
            description: desc || 'Sin descripción',
            started_at: startedAt,
            billable,
          })
          setEntries(prev => [entry, ...prev])
        } catch { console.error('Error saving time entry') }
        finally { setSaving(false) }
      }
      setElapsed(0)
      setStartedAt(null)
      setDesc('')
    } else {
      setStartedAt(new Date().toISOString())
    }
    setRunning(r => !r)
  }

  const addManual = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const entry = await TimeEntriesService.create({
        project_id: manual.project_id || undefined,
        description: manual.description,
        hours: parseFloat(manual.hours),
        date: manual.date,
        billable: manual.billable,
        hourly_rate: manual.billable ? HOURLY_RATE : 0,
      })
      setEntries(prev => [entry, ...prev])
      setManual({ project_id: projects[0]?.id ?? '', description: '', hours: '', date: new Date().toISOString().slice(0, 10), billable: true })
      setShowManual(false)
    } catch { console.error('Error') }
    finally { setSaving(false) }
  }

  const remove = async (id: number) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    try { await TimeEntriesService.remove(id) } catch { /* optimistic */ }
  }

  const totalHours    = entries.reduce((a, e) => a + Number(e.hours), 0)
  const billableHours = entries.filter(e => e.billable).reduce((a, e) => a + Number(e.hours), 0)
  const billableValue = entries.filter(e => e.billable).reduce((a, e) => a + Number(e.hours) * (e.hourly_rate ?? HOURLY_RATE), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="card py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Horas totales</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{totalHours.toFixed(1)}h</p>
        </div>
        <div className="card py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Horas facturables</p>
          <p className="text-2xl font-bold text-emerald-400">{billableHours.toFixed(1)}h</p>
        </div>
        <div className="card py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Valor facturable</p>
          <p className="text-2xl font-bold text-emerald-400">RD$ {billableValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="card border-emerald-500/20 space-y-4">
        <p className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Cronómetro activo</p>
        <div className="flex items-center gap-4 flex-wrap">
          <select
            disabled={running}
            className="input py-1.5 text-sm flex-1 min-w-[200px]"
            value={selProjectId}
            onChange={e => setSelProjectId(Number(e.target.value))}
          >
            <option value="">Sin proyecto</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input
            disabled={running}
            className="input py-1.5 text-sm flex-1 min-w-[160px]"
            placeholder="¿En qué estás trabajando?"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <label className="flex items-center gap-2 text-xs cursor-pointer flex-shrink-0" style={{ color: 'var(--text-2)' }}>
            <input type="checkbox" checked={billable} onChange={e => setBillable(e.target.checked)} disabled={running} className="accent-emerald-500" />
            Facturable
          </label>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`font-mono text-2xl font-bold tabular-nums ${running ? 'text-emerald-400' : ''}`}
              style={!running ? { color: 'var(--text-3)' } : {}}>
              {fmt(elapsed)}
            </span>
            <button
              onClick={startStop}
              disabled={saving}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                running ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {saving ? <Loader2 size={16} className="text-white animate-spin" />
                : running ? <Square size={16} className="text-white" />
                : <Play size={16} className="text-white" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{entries.length} entradas registradas</p>
        <button onClick={() => setShowManual(true)} className="btn-secondary text-xs py-1.5">
          <Plus size={13} /> Agregar manual
        </button>
      </div>

      {showManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Registro manual de horas</h3>
              <button onClick={() => setShowManual(false)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={addManual} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Proyecto</label>
                <select className="input" value={manual.project_id} onChange={e => setManual(f => ({ ...f, project_id: Number(e.target.value) }))}>
                  <option value="">Sin proyecto</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Descripción</label>
                  <input required className="input" value={manual.description} onChange={e => setManual(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Horas</label>
                  <input required type="number" step="0.5" min="0.5" className="input" value={manual.hours} onChange={e => setManual(f => ({ ...f, hours: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Fecha</label>
                  <input type="date" className="input" value={manual.date} onChange={e => setManual(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" checked={manual.billable} onChange={e => setManual(f => ({ ...f, billable: e.target.checked }))} className="accent-emerald-500" />
                  <label className="text-xs" style={{ color: 'var(--text-2)' }}>Facturable</label>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowManual(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2" disabled={saving}>
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>No hay entradas de tiempo registradas</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Proyecto</th>
                <th className="table-header">Descripción</th>
                <th className="table-header">Fecha</th>
                <th className="table-header text-right">Horas</th>
                <th className="table-header text-right">Valor</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="table-row">
                  <td className="table-cell">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>
                      {e.project?.name ?? 'Sin proyecto'}
                    </p>
                  </td>
                  <td className="table-cell text-sm" style={{ color: 'var(--text-2)' }}>{e.description}</td>
                  <td className="table-cell text-xs font-mono" style={{ color: 'var(--text-3)' }}>{e.date}</td>
                  <td className="table-cell text-right font-mono text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                    {Number(e.hours).toFixed(1)}h
                  </td>
                  <td className="table-cell text-right font-mono text-sm">
                    {e.billable
                      ? <span className="text-emerald-400">RD$ {(Number(e.hours) * (e.hourly_rate ?? HOURLY_RATE)).toLocaleString()}</span>
                      : <span style={{ color: 'var(--text-3)' }}>—</span>
                    }
                  </td>
                  <td className="table-cell">
                    <button onClick={() => remove(e.id!)} className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
