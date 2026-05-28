import { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp, Square, Circle, CheckSquare, AlertCircle, Clock, CheckCircle, Loader2, X } from 'lucide-react'
import Badge from '@/components/Badge'
import { ProjectsService, type Project, type Task } from '@/lib/services/projects.service'
import { ClientsService, type Client } from '@/lib/services/clients.service'

type TaskStatus = 'todo' | 'doing' | 'done'

const statusConfig: Record<string, { label: string; color: 'green'|'amber'|'blue'|'gray'|'red'; icon: React.ElementType }> = {
  active:    { label: 'Activo',     color: 'green', icon: Circle      },
  paused:    { label: 'Pausado',    color: 'amber', icon: Clock       },
  completed: { label: 'Completado', color: 'blue',  icon: CheckCircle },
  cancelled: { label: 'Cancelado',  color: 'gray',  icon: AlertCircle },
}

const taskStatusIcon: Record<TaskStatus, React.ElementType> = {
  todo: Square, doing: Circle, done: CheckSquare,
}
const taskStatusColor: Record<TaskStatus, string> = {
  todo: 'text-gray-600', doing: 'text-amber-400', done: 'text-emerald-400',
}

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients]   = useState<Client[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ name: '', client_id: '', budget: '', deadline: '', description: '' })

  useEffect(() => {
    Promise.all([
      ProjectsService.list(),
      ClientsService.list(),
    ]).then(([p, c]) => {
      setProjects(p)
      setClients(c)
      if (p[0]) setExpanded(p[0].id!)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const toggleTask = async (pId: number, task: Task) => {
    const next: TaskStatus = task.status === 'todo' ? 'doing' : task.status === 'doing' ? 'done' : 'todo'
    setProjects(prev => prev.map(p => p.id !== pId ? p : {
      ...p, tasks: p.tasks?.map(t => t.id === task.id ? { ...t, status: next } : t),
    }))
    try { await ProjectsService.updateTaskStatus(task.id!, next) } catch { /* revert would go here */ }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await ProjectsService.create({
        name: form.name,
        client_id: form.client_id ? parseInt(form.client_id) : undefined,
        budget: parseFloat(form.budget) || 0,
        deadline: form.deadline || undefined,
        description: form.description || undefined,
        status: 'active',
      })
      setProjects(prev => [created, ...prev])
      setForm({ name: '', client_id: '', budget: '', deadline: '', description: '' })
      setShowForm(false)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const active      = projects.filter(p => p.status === 'active').length
  const totalBudget = projects.filter(p => p.status === 'active').reduce((a, p) => a + (p.budget ?? 0), 0)
  const totalHours  = projects.reduce((a, p) => a + (p.tasks?.filter(t => t.status === 'done').length ?? 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="card py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Proyectos activos</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{active}</p>
        </div>
        <div className="card py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Budget total activo</p>
          <p className="text-2xl font-bold text-emerald-400">RD$ {totalBudget.toLocaleString()}</p>
        </div>
        <div className="card py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Tareas completadas</p>
          <p className="text-2xl font-bold text-blue-400">{totalHours}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{projects.length} proyectos</p>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs py-1.5">
          <Plus size={13} /> Nuevo proyecto
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Nuevo proyecto</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Nombre del proyecto</label>
                <input required className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Cliente (opcional)</label>
                <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">Sin cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Budget (RD$)</label>
                  <input type="number" className="input" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Deadline</label>
                  <input type="date" className="input" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Descripción</label>
                <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2" disabled={saving}>
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving ? 'Creando...' : 'Crear proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>No hay proyectos. Crea el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => {
            const st       = statusConfig[p.status] ?? statusConfig.active
            const tasks    = p.tasks ?? []
            const done     = tasks.filter(t => t.status === 'done').length
            const progress = tasks.length > 0 ? Math.round(done / tasks.length * 100) : 0
            const isOpen   = expanded === p.id

            return (
              <div key={p.id} className="card p-0 overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : p.id!)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-800/20 transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{p.name}</p>
                      <Badge variant={st.color}>{st.label}</Badge>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {p.deadline ? `Deadline: ${p.deadline}` : 'Sin deadline'}
                      {p.description && <span className="ml-2">· {p.description}</span>}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-800">
                        <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[10px] font-mono flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                        {done}/{tasks.length} tareas · {progress}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    {(p.budget ?? 0) > 0 && <p className="text-sm font-mono font-bold text-emerald-400">RD$ {Number(p.budget).toLocaleString()}</p>}
                  </div>
                  {isOpen ? <ChevronUp size={15} className="text-gray-600 flex-shrink-0" /> : <ChevronDown size={15} className="text-gray-600 flex-shrink-0" />}
                </button>

                {isOpen && tasks.length > 0 && (
                  <div className="border-t border-gray-800 bg-gray-900/40">
                    {tasks.map(t => {
                      const TIcon = taskStatusIcon[t.status as TaskStatus] ?? Square
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggleTask(p.id!, t)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-800/30 transition-colors border-b border-gray-800/50 last:border-b-0"
                        >
                          <TIcon size={14} className={taskStatusColor[t.status as TaskStatus] ?? 'text-gray-600'} />
                          <span className={`flex-1 text-left text-xs ${t.status === 'done' ? 'line-through text-gray-600' : ''}`}
                            style={t.status !== 'done' ? { color: 'var(--text-2)' } : {}}>
                            {t.title}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {isOpen && tasks.length === 0 && (
                  <div className="border-t border-gray-800 px-5 py-3">
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin tareas aún</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
