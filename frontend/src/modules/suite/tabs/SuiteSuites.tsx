import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Loader2, GripVertical, Check, Package } from 'lucide-react'
import Badge from '@/components/Badge'
import { SaasSuitesService, type SaasSuite, type SaasModule } from '@/lib/services/saas.service'

const ICON_OPTIONS = ['ShoppingCart', 'HardHat', 'Package', 'Briefcase', 'Wrench', 'BarChart2', 'Users', 'FileText', 'Globe', 'Layers']

const BLANK_FORM = { key: '', label: '', icon: 'Package', modules: [] as SaasModule[] }

export function SuiteSuites() {
  const [suites, setSuites]         = useState<SaasSuite[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState<number | null>(null)
  const [form, setForm]             = useState(BLANK_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deleteFor, setDeleteFor]   = useState<SaasSuite | null>(null)
  const [deleting, setDeleting]     = useState(false)

  const [newMod, setNewMod] = useState({ key: '', label: '' })

  useEffect(() => {
    SaasSuitesService.list()
      .then(setSuites)
      .finally(() => setLoading(false))
  }, [])

  const openNew = () => {
    setForm(BLANK_FORM)
    setEditingId(null)
    setNewMod({ key: '', label: '' })
    setShowForm(true)
  }

  const openEdit = (s: SaasSuite) => {
    setForm({ key: s.key, label: s.label, icon: s.icon, modules: [...(s.modules ?? [])] })
    setEditingId(s.id)
    setNewMod({ key: '', label: '' })
    setShowForm(true)
  }

  const addModule = () => {
    const k = newMod.key.trim().toLowerCase().replace(/\s+/g, '_')
    const l = newMod.label.trim()
    if (!k || !l) return
    if (form.modules.some(m => m.key === k)) return
    setForm(f => ({ ...f, modules: [...f.modules, { key: k, label: l }] }))
    setNewMod({ key: '', label: '' })
  }

  const removeModule = (key: string) =>
    setForm(f => ({ ...f, modules: f.modules.filter(m => m.key !== key) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingId !== null) {
        const updated = await SaasSuitesService.update(editingId, {
          label: form.label, icon: form.icon, modules: form.modules,
        })
        setSuites(prev => prev.map(s => s.id === editingId ? updated : s))
        setEditingId(null)
      } else {
        const created = await SaasSuitesService.create(form)
        setSuites(prev => [...prev, created])
      }
      setForm(BLANK_FORM)
      setShowForm(false)
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!deleteFor) return
    setDeleting(true)
    try {
      await SaasSuitesService.remove(deleteFor.id)
      setSuites(prev => prev.filter(s => s.id !== deleteFor.id))
      setDeleteFor(null)
    } finally { setDeleting(false) }
  }

  const handleToggleActive = async (s: SaasSuite) => {
    const next = !s.active
    setSuites(prev => prev.map(x => x.id === s.id ? { ...x, active: next } : x))
    try { await SaasSuitesService.update(s.id, { active: next }) }
    catch { setSuites(prev => prev.map(x => x.id === s.id ? { ...x, active: s.active } : x)) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--text-3)' }} />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          {suites.filter(s => s.active).length} suites activas · {suites.reduce((a, s) => a + (s.modules?.length ?? 0), 0)} módulos en total
        </p>
        <button onClick={openNew} className="btn-primary text-xs py-1.5">
          <Plus size={13} /> Nueva Suite
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{editingId !== null ? 'Editar suite' : 'Nueva suite'}</p>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="p-1 text-gray-500 hover:text-gray-300"><X size={16} /></button>
            </div>
            <div className="px-6 py-4 overflow-y-auto max-h-[75vh]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Clave (key)</label>
                    <input required className="input font-mono" placeholder="commerce"
                      disabled={editingId !== null}
                      value={form.key}
                      onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))} />
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>Solo minúsculas, sin espacios. No se puede cambiar.</p>
                  </div>
                  <div>
                    <label className="label">Nombre</label>
                    <input required className="input" placeholder="Suite Commerce"
                      value={form.label}
                      onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Ícono</label>
                    <div className="flex flex-wrap gap-2">
                      {ICON_OPTIONS.map(ic => (
                        <button key={ic} type="button"
                          onClick={() => setForm(f => ({ ...f, icon: ic }))}
                          className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                            form.icon === ic
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          }`}
                          style={{ color: form.icon === ic ? undefined : 'var(--text-2)' }}>
                          {form.icon === ic && <Check size={10} className="inline mr-1" />}
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label mb-2">Módulos de esta suite</label>
                  {form.modules.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {form.modules.map(m => (
                        <div key={m.key} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 bg-gray-800/30">
                          <GripVertical size={12} className="text-gray-600 flex-shrink-0" />
                          <span className="font-mono text-xs text-blue-400 flex-shrink-0 w-28 truncate">{m.key}</span>
                          <span className="text-xs flex-1" style={{ color: 'var(--text-2)' }}>{m.label}</span>
                          <button type="button" onClick={() => removeModule(m.key)}
                            className="text-gray-600 hover:text-red-400 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input className="input font-mono text-xs w-36" placeholder="clave_modulo"
                      value={newMod.key}
                      onChange={e => setNewMod(m => ({ ...m, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addModule())} />
                    <input className="input text-xs flex-1" placeholder="Nombre del módulo"
                      value={newMod.label}
                      onChange={e => setNewMod(m => ({ ...m, label: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addModule())} />
                    <button type="button" onClick={addModule}
                      className="px-3 py-2 rounded-lg border border-gray-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
                      style={{ color: 'var(--text-2)' }}>
                      <Plus size={13} />
                    </button>
                  </div>
                  <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-3)' }}>
                    Escribe la clave y el nombre, luego presiona Enter o el botón +
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }}
                    className="btn-secondary flex-1">Cancelar</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1">
                    {submitting ? <Loader2 size={13} className="animate-spin" />
                      : editingId !== null ? 'Guardar cambios' : 'Crear suite'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Suite list */}
      <div className="space-y-3">
        {suites.length === 0 ? (
          <div className="card text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>
            No hay suites registradas.
          </div>
        ) : suites.map(s => (
          <div key={s.id} className={`card p-0 overflow-visible transition-opacity ${!s.active ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-4 p-5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{s.label}</p>
                  <Badge variant={s.active ? 'green' : 'gray'}>{s.active ? 'Activa' : 'Inactiva'}</Badge>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{s.key}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(s.modules ?? []).length > 0
                    ? s.modules.map(m => (
                        <span key={m.key} className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800 font-mono"
                          style={{ color: 'var(--text-3)' }}>
                          {m.key} <span className="text-gray-500">·</span> <span style={{ color: 'var(--text-2)' }}>{m.label}</span>
                        </span>
                      ))
                    : <span className="text-xs" style={{ color: 'var(--text-3)' }}>Sin módulos</span>}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(s)}
                  className="p-1.5 rounded-md text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Editar">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => handleToggleActive(s)}
                  className={`p-1.5 rounded-md transition-colors ${s.active
                    ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                    : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                  title={s.active ? 'Desactivar' : 'Activar'}>
                  <X size={13} />
                </button>
                <button onClick={() => setDeleteFor(s)}
                  className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Eliminar">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete modal */}
      {deleteFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border p-6 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: 'var(--text-1)' }}>Eliminar suite</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
                Se eliminará <strong style={{ color: 'var(--text-1)' }}>{deleteFor.label}</strong>. Los planes que la usan no se verán afectados, pero la suite dejará de estar disponible.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteFor(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <><Trash2 size={13} /> Eliminar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
