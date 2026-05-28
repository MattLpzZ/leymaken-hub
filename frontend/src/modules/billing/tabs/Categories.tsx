import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Tag, Check, X, Loader2 } from 'lucide-react'
import Badge from '@/components/Badge'
import { CategoriesService, type InvoiceCategory } from '@/lib/services/categories.service'

type BadgeColor = 'blue' | 'green' | 'purple' | 'cyan' | 'amber' | 'gray' | 'red'

const COLOR_OPTIONS: { value: BadgeColor; label: string }[] = [
  { value: 'blue',   label: 'Azul' },
  { value: 'green',  label: 'Verde' },
  { value: 'purple', label: 'Morado' },
  { value: 'cyan',   label: 'Cian' },
  { value: 'amber',  label: 'Ámbar' },
  { value: 'gray',   label: 'Gris' },
  { value: 'red',    label: 'Rojo' },
]

const BLANK = { name: '', color: 'blue' as BadgeColor, description: '' }

export default function Categories() {
  const [categories, setCategories] = useState<InvoiceCategory[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(BLANK)
  const [editingId, setEditingId]   = useState<number | null>(null)
  const [editForm, setEditForm]     = useState(BLANK)

  useEffect(() => {
    CategoriesService.list()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const created = await CategoriesService.create({
      name: form.name,
      color: form.color,
      description: form.description || null,
    })
    setCategories(prev => [...prev, created])
    setForm(BLANK)
    setShowForm(false)
  }

  const startEdit = (cat: InvoiceCategory) => {
    setEditingId(cat.id)
    setEditForm({ name: cat.name, color: cat.color, description: cat.description ?? '' })
  }

  const saveEdit = async (id: number) => {
    const updated = await CategoriesService.update(id, {
      name: editForm.name,
      color: editForm.color,
      description: editForm.description || null,
    })
    setCategories(prev => prev.map(c => c.id === id ? updated : c))
    setEditingId(null)
  }

  const remove = async (id: number) => {
    setCategories(prev => prev.filter(c => c.id !== id))
    CategoriesService.remove(id).catch(() =>
      CategoriesService.list().then(setCategories)
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-emerald-400" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          {categories.length} categorías · usadas para clasificar servicios, facturas y cotizaciones
        </p>
        <button onClick={() => { setShowForm(true); setEditingId(null) }} className="btn-primary text-xs py-1.5">
          <Plus size={13} /> Nueva Categoría
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Nueva categoría</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nombre</label>
                  <input
                    required
                    className="input"
                    placeholder="Ej: Marketing Digital..."
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Color de etiqueta</label>
                  <select
                    className="input"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value as BadgeColor }))}
                  >
                    {COLOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Descripción</label>
                <input
                  className="input"
                  placeholder="Descripción corta de la categoría..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Agregar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Tag size={28} className="text-gray-600" />
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin categorías. Crea la primera.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-10"></th>
                <th className="table-header">Categoría</th>
                <th className="table-header">Descripción</th>
                <th className="table-header text-right"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="table-row">
                  <td className="table-cell">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800">
                      <Tag size={14} className="text-gray-400" />
                    </div>
                  </td>

                  <td className="table-cell">
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          className="input py-1 text-sm w-36"
                          value={editForm.name}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        />
                        <select
                          className="input py-1 text-xs w-24"
                          value={editForm.color}
                          onChange={e => setEditForm(f => ({ ...f, color: e.target.value as BadgeColor }))}
                        >
                          {COLOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    ) : (
                      <Badge variant={cat.color}>{cat.name}</Badge>
                    )}
                  </td>

                  <td className="table-cell text-sm" style={{ color: 'var(--text-2)' }}>
                    {editingId === cat.id ? (
                      <input
                        className="input py-1 text-sm w-full"
                        value={editForm.description}
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      />
                    ) : (
                      <span className="truncate max-w-xs block">
                        {cat.description || <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </span>
                    )}
                  </td>

                  <td className="table-cell">
                    <div className="flex gap-1 justify-end">
                      {editingId === cat.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(cat.id)}
                            className="p-1.5 rounded-md text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(cat)}
                            className="p-1.5 rounded-md text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => remove(cat.id)}
                            className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
