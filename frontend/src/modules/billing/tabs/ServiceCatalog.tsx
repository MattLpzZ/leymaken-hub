import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Package, X, Loader2 } from 'lucide-react'
import Badge from '@/components/Badge'
import { ServiceItemsService, type ServiceItem } from '@/lib/services/service-items.service'

const CATEGORIES = ['Desarrollo','SaaS','Consultoría','Automatización','Infraestructura','Mantenimiento']
const UNITS      = ['proyecto','mes','hora','año']

const catColor: Record<string, 'blue'|'green'|'purple'|'cyan'|'amber'|'gray'> = {
  'Desarrollo': 'blue', 'SaaS': 'green', 'Consultoría': 'purple',
  'Automatización': 'cyan', 'Infraestructura': 'amber', 'Mantenimiento': 'gray',
}

const BLANK = { name: '', category: 'Desarrollo', price: '', unit: 'proyecto', description: '' }

export default function ServiceCatalog() {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<ServiceItem | null>(null)
  const [form, setForm]         = useState(BLANK)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    ServiceItemsService.list()
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const openCreate = () => { setEditing(null); setForm(BLANK); setShowForm(true) }
  const openEdit   = (s: ServiceItem) => {
    setEditing(s)
    setForm({ name: s.name, category: s.category, price: String(s.price), unit: s.unit, description: s.description ?? '' })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, price: parseFloat(form.price) }
      if (editing) {
        const updated = await ServiceItemsService.update(editing.id, payload)
        setServices(prev => prev.map(s => s.id === editing.id ? updated : s))
      } else {
        const created = await ServiceItemsService.create(payload as any)
        setServices(prev => [...prev, created])
      }
      setShowForm(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (s: ServiceItem) => {
    const updated = await ServiceItemsService.update(s.id, { active: !s.active })
    setServices(prev => prev.map(x => x.id === s.id ? updated : x))
  }

  const remove = async (s: ServiceItem) => {
    if (!confirm(`¿Eliminar "${s.name}"?`)) return
    await ServiceItemsService.remove(s.id)
    setServices(prev => prev.filter(x => x.id !== s.id))
  }

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 size={24} className="animate-spin text-emerald-400" /></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          {services.filter(s => s.active).length} servicios activos en catálogo
        </p>
        <button onClick={openCreate} className="btn-primary text-xs py-1.5">
          <Plus size={13} /> Nuevo Servicio
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header w-10"></th>
              <th className="table-header">Servicio</th>
              <th className="table-header">Categoría</th>
              <th className="table-header text-right">Precio base</th>
              <th className="table-header">Unidad</th>
              <th className="table-header">Estado</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className={`table-row ${!s.active ? 'opacity-50' : ''}`}>
                <td className="table-cell">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.active ? 'bg-emerald-500/10' : 'bg-gray-500/10'}`}>
                    <Package size={14} className={s.active ? 'text-emerald-400' : 'text-gray-500'} />
                  </div>
                </td>
                <td className="table-cell">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{s.name}</p>
                  <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: 'var(--text-3)' }}>{s.description}</p>
                </td>
                <td className="table-cell">
                  <Badge variant={catColor[s.category] ?? 'gray'}>{s.category}</Badge>
                </td>
                <td className="table-cell text-right font-mono text-sm text-emerald-400 font-semibold">
                  RD$ {Number(s.price).toLocaleString()}
                </td>
                <td className="table-cell text-xs" style={{ color: 'var(--text-3)' }}>/{s.unit}</td>
                <td className="table-cell">
                  <button onClick={() => toggle(s)} className="cursor-pointer">
                    <Badge variant={s.active ? 'green' : 'gray'}>{s.active ? 'Activo' : 'Inactivo'}</Badge>
                  </button>
                </td>
                <td className="table-cell">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-md text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"><Edit2 size={13} /></button>
                    <button onClick={() => remove(s)} className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr><td colSpan={7} className="table-cell text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>Sin servicios en catálogo</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                {editing ? 'Editar servicio' : 'Nuevo servicio'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"><X size={16} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Nombre del servicio</label>
                <input required className="input" placeholder="Ej: Desarrollo Landing Page..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Categoría</label>
                  <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Unidad</label>
                  <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Precio base (RD$)</label>
                <input required type="number" min="0" className="input" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="label">Descripción</label>
                <input className="input" placeholder="Descripción corta del servicio..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
