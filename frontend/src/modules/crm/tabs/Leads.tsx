import { useState, useEffect } from 'react'
import { Plus, Search, User, Building2, Phone, Mail, Trash2, Loader2, X } from 'lucide-react'
import { CrmLeadsService, type CrmLead } from '@/lib/services/crm.service'

type LeadSource = 'referido' | 'whatsapp' | 'instagram' | 'web' | 'directo' | 'otro'
type LeadStatus = 'activo' | 'calificado' | 'descartado'

const sourceLabel: Record<LeadSource, string> = {
  referido: 'Referido', whatsapp: 'WhatsApp', instagram: 'Instagram', web: 'Web', directo: 'Directo', otro: 'Otro',
}
const sourceColor: Record<LeadSource, string> = {
  referido: 'badge-green', whatsapp: 'badge-blue', instagram: 'badge-blue', web: 'badge-blue', directo: 'badge-gray', otro: 'badge-yellow',
}

const BLANK = { name: '', email: '', phone: '', company: '', source: 'directo' as LeadSource, notes: '' }

export default function Leads() {
  const [leads, setLeads]       = useState<CrmLead[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(BLANK)

  useEffect(() => {
    CrmLeadsService.list()
      .then(data => setLeads(data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.notes ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (l.company ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const created = await CrmLeadsService.create({
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      company: form.company || undefined,
      source: form.source,
      notes: form.notes || undefined,
      status: 'activo',
    })
    setLeads(prev => [...prev, created])
    setForm(BLANK)
    setShowForm(false)
  }

  const setStatus = async (id: number, status: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    try {
      await CrmLeadsService.update(id, { status })
    } catch {
      // Rollback on failure by re-fetching
      CrmLeadsService.list().then(data => setLeads(data))
    }
  }

  const remove = async (id: number) => {
    setLeads(prev => prev.filter(l => l.id !== id))
    try {
      await CrmLeadsService.remove(id)
    } catch {
      CrmLeadsService.list().then(data => setLeads(data))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input className="input pl-9 py-1.5 text-xs" placeholder="Buscar contacto o interés..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs py-1.5">
          <Plus size={13} /> Nuevo contacto
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Nuevo contacto</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nombre</label>
                  <input required className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Empresa</label>
                  <input className="input" placeholder="Nombre de la empresa..." value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Fuente</label>
                  <select className="input" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as LeadSource }))}>
                    {Object.entries(sourceLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Notas</label>
                  <input className="input" placeholder="Interés, contexto..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {leads.length === 0 && !showForm ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Sin contactos registrados</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Crea tu primer contacto con el botón de arriba</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-10"></th>
                <th className="table-header">Contacto</th>
                <th className="table-header">Contacto</th>
                <th className="table-header">Fuente</th>
                <th className="table-header">Notas</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Fecha</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="table-row">
                  <td className="table-cell">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                      {l.company ? <Building2 size={14} className="text-gray-400" /> : <User size={14} className="text-gray-400" />}
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{l.name}</p>
                    <span className={`badge ${l.company ? 'badge-blue' : 'badge-gray'} mt-1`}>{l.company ? 'Empresa' : 'Persona'}</span>
                  </td>
                  <td className="table-cell">
                    {l.email && <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}><Mail size={10} />{l.email}</p>}
                    {l.phone && <p className="text-xs flex items-center gap-1.5 mt-1" style={{ color: 'var(--text-3)' }}><Phone size={10} />{l.phone}</p>}
                  </td>
                  <td className="table-cell"><span className={`badge ${sourceColor[l.source as LeadSource]}`}>{sourceLabel[l.source as LeadSource]}</span></td>
                  <td className="table-cell text-sm" style={{ color: 'var(--text-2)' }}>{l.notes ?? '—'}</td>
                  <td className="table-cell">
                    <select
                      value={l.status}
                      onChange={e => setStatus(l.id, e.target.value as LeadStatus)}
                      className="text-xs rounded-lg px-2 py-1 border border-gray-700 bg-gray-800"
                      style={{ color: 'var(--text-2)' }}
                    >
                      <option value="activo">Activo</option>
                      <option value="calificado">Calificado</option>
                      <option value="descartado">Descartado</option>
                    </select>
                  </td>
                  <td className="table-cell text-xs" style={{ color: 'var(--text-3)' }}>{l.created_at?.slice(0, 10) ?? '—'}</td>
                  <td className="table-cell">
                    <button onClick={() => remove(l.id)} className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && leads.length > 0 && (
                <tr>
                  <td colSpan={8} className="table-cell text-center py-8 text-xs" style={{ color: 'var(--text-3)' }}>
                    Sin resultados para "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
