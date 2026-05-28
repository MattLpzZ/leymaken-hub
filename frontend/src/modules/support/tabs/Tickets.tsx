import { useEffect, useState } from 'react'
import { Plus, Search, Clock, CheckCircle, AlertCircle, ChevronRight, X } from 'lucide-react'
import { Headphones } from 'lucide-react'
import Badge from '@/components/Badge'
import StatCard from '@/components/StatCard'
import { TicketsService, type Ticket, type TicketSummary } from '@/lib/services/tickets.service'

const statusMap: Record<string, { label: string; color: 'amber' | 'blue' | 'green' | 'gray' }> = {
  open:        { label: 'Abierto',    color: 'amber' },
  in_progress: { label: 'En proceso', color: 'blue' },
  closed:      { label: 'Cerrado',    color: 'green' },
  waiting:     { label: 'Esperando',  color: 'gray' },
}

const priorityMap: Record<string, { color: 'red' | 'amber' | 'blue' | 'gray' }> = {
  high:   { color: 'red' },
  medium: { color: 'amber' },
  low:    { color: 'blue' },
}

const sourceIcon: Record<string, string> = {
  whatsapp: '💬',
  instagram: '📸',
  manual: '📝',
  email: '📧',
}

const emptyForm = {
  subject: '',
  description: '',
  status: 'open' as Ticket['status'],
  priority: 'medium' as Ticket['priority'],
  source: 'manual' as Ticket['source'],
  contact_name: '',
  contact_info: '',
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [summary, setSummary] = useState<TicketSummary | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Ticket | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [res, sum] = await Promise.all([
        TicketsService.list({ search: search || undefined, status: statusFilter || undefined }),
        TicketsService.summary(),
      ])
      setTickets(res.data ?? res)
      setSummary(sum)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, statusFilter])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (t: Ticket) => {
    setEditing(t)
    setForm({
      subject: t.subject,
      description: t.description ?? '',
      status: t.status,
      priority: t.priority,
      source: t.source,
      contact_name: t.contact_name ?? '',
      contact_info: t.contact_info ?? '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await TicketsService.update(editing.id, form)
      } else {
        await TicketsService.create(form)
      }
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este ticket?')) return
    await TicketsService.destroy(id)
    load()
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Abiertos"     value={summary?.open ?? 0}         icon={AlertCircle}  color="bg-amber-600" />
        <StatCard title="En proceso"   value={summary?.in_progress ?? 0}  icon={Clock}        color="bg-blue-600" />
        <StatCard title="Cerrados hoy" value={summary?.closed_today ?? 0} icon={CheckCircle}  color="bg-emerald-600" />
        <StatCard title="Total"        value={summary?.total ?? 0}        icon={Headphones}   color="bg-purple-600" />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 flex-1">
            <div className="relative max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
              <input
                className="input pl-9 py-1.5 text-xs"
                placeholder="Buscar ticket..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input py-1.5 text-xs"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="open">Abierto</option>
              <option value="in_progress">En proceso</option>
              <option value="waiting">Esperando</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
          <button className="btn-primary text-xs py-1.5" onClick={openCreate}>
            <Plus size={13} /> Nuevo Ticket
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>Cargando...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>Sin tickets</div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {tickets.map((t) => {
              const st = statusMap[t.status] ?? { label: t.status, color: 'gray' as const }
              const pr = priorityMap[t.priority] ?? { color: 'gray' as const }
              return (
                <div key={t.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800/20 cursor-pointer transition-colors" onClick={() => openEdit(t)}>
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-lg">
                    {sourceIcon[t.source] ?? '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>#{t.id}</span>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{t.subject}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>{t.company?.name ?? t.contact_name ?? '—'}</span>
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                        <Clock size={10} /> {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={pr.color}>{t.priority}</Badge>
                    <Badge variant={st.color}>{st.label}</Badge>
                    <button
                      className="text-xs text-red-400 hover:text-red-300 ml-1"
                      onClick={e => { e.stopPropagation(); handleDelete(t.id) }}
                    >
                      <X size={13} />
                    </button>
                    <ChevronRight size={14} style={{ color: 'var(--text-3)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="card w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{editing ? 'Editar Ticket' : 'Nuevo Ticket'}</h3>
              <button onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Asunto *</label>
                <input className="input" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Estado</label>
                  <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Ticket['status'] }))}>
                    <option value="open">Abierto</option>
                    <option value="in_progress">En proceso</option>
                    <option value="waiting">Esperando</option>
                    <option value="closed">Cerrado</option>
                  </select>
                </div>
                <div>
                  <label className="label">Prioridad</label>
                  <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Ticket['priority'] }))}>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="label">Fuente</label>
                  <select className="input" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as Ticket['source'] }))}>
                    <option value="manual">Manual</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Contacto</label>
                  <input className="input" placeholder="Nombre" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Info de contacto</label>
                  <input className="input" placeholder="Tel / email" value={form.contact_info} onChange={e => setForm(f => ({ ...f, contact_info: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost text-sm" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary text-sm" disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
