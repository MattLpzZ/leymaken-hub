import { useEffect, useState } from 'react'
import {
  Plus, Trash2, Edit2, ChevronDown, ChevronUp,
  Globe, Package, Star, Clock, Video, Scissors, Send,
} from 'lucide-react'
import {
  CmmService,
  type CmmClient,
  type CmmCatalogItem,
  type CmmTimeBlocks,
  type WeekDay,
} from '@/lib/services/cmm.service'

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  facebook:  { label: 'Facebook',  color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  instagram: { label: 'Instagram', color: 'bg-pink-500/15 text-pink-400 border-pink-500/20' },
  whatsapp:  { label: 'WhatsApp',  color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  wordpress: { label: 'WordPress', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
  tiktok:    { label: 'TikTok',    color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  linkedin:  { label: 'LinkedIn',  color: 'bg-sky-500/15 text-sky-400 border-sky-500/20' },
  otro:      { label: 'Otro',      color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
}

const ALL_PLATFORMS = Object.keys(PLATFORM_META)

const DAYS: WeekDay[] = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const DAY_SHORT: Record<WeekDay, string> = {
  'lunes': 'Lun', 'martes': 'Mar', 'miércoles': 'Mié',
  'jueves': 'Jue', 'viernes': 'Vie', 'sábado': 'Sáb', 'domingo': 'Dom',
}
const HOURS = Array.from({ length: 17 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)

const BLANK_TIME_BLOCKS: CmmTimeBlocks = {
  record:      { day: 'lunes',   hour: '10:00' },
  edit:        { day: 'martes',  hour: '14:00' },
  publish:     { day: 'miércoles', hour: '09:00' },
  daily_hours: 4,
}

const BLANK_CLIENT: Partial<CmmClient> = {
  name: '', active: true, is_own_brand: false, platforms: [],
  folder_id: null, brand_voice: null, whatsapp_cta: null,
  fb_page_id: null, fb_token: null, ig_account_id: null,
  wp_url: null, wp_user: null, wp_app_password: null,
  time_blocks: null,
}

// ─── Time Blocks Section ──────────────────────────────────────────────────────

function TimeBlocksSection({
  value,
  onChange,
}: {
  value: CmmTimeBlocks | null | undefined
  onChange: (tb: CmmTimeBlocks | null) => void
}) {
  const enabled = !!value
  const tb = value ?? BLANK_TIME_BLOCKS

  function patchBlock(
    key: 'record' | 'edit' | 'publish',
    field: 'day' | 'hour',
    val: string,
  ) {
    const current = tb[key] ?? { day: 'lunes', hour: '09:00' }
    onChange({ ...tb, [key]: { ...current, [field]: val } })
  }

  const BLOCKS: { key: 'record' | 'edit' | 'publish'; label: string; icon: React.ElementType; color: string }[] = [
    { key: 'record',  label: 'Grabar',   icon: Video,    color: 'text-rose-400'    },
    { key: 'edit',    label: 'Editar',   icon: Scissors, color: 'text-amber-400'   },
    { key: 'publish', label: 'Publicar', icon: Send,     color: 'text-emerald-400' },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
          <Clock size={11} /> Horario semanal
        </p>
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={enabled}
              onChange={e => onChange(e.target.checked ? BLANK_TIME_BLOCKS : null)} />
            <div className={`w-8 h-4 rounded-full transition-colors ${enabled ? 'bg-emerald-600' : 'bg-gray-700'}`} />
            <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>{enabled ? 'Configurado' : 'Sin horario'}</span>
        </label>
      </div>

      {enabled && (
        <div className="space-y-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          {BLOCKS.map(({ key, label, icon: Icon, color }) => {
            const block = tb[key]
            return (
              <div key={key} className="grid grid-cols-[100px_1fr_1fr] items-center gap-2">
                <span className={`text-xs font-medium flex items-center gap-1.5 ${color}`}>
                  <Icon size={11} /> {label}
                </span>
                <select
                  className="input text-xs py-1.5"
                  value={block?.day ?? 'lunes'}
                  onChange={e => patchBlock(key, 'day', e.target.value)}
                >
                  {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
                <select
                  className="input text-xs py-1.5"
                  value={block?.hour ?? '09:00'}
                  onChange={e => patchBlock(key, 'hour', e.target.value)}
                >
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            )
          })}

          <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>Horas diarias comprometidas:</span>
            <select
              className="input text-xs py-1 w-20"
              value={tb.daily_hours}
              onChange={e => onChange({ ...tb, daily_hours: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6, 8].map(h => (
                <option key={h} value={h}>{h}h</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Time Blocks Badge (compact display on card) ──────────────────────────────

function TimeBlocksBadge({ tb }: { tb: CmmTimeBlocks }) {
  const rows: { label: string; icon: React.ElementType; color: string; key: 'record' | 'edit' | 'publish' }[] = [
    { key: 'record',  label: 'Graba',   icon: Video,    color: 'text-rose-400'    },
    { key: 'edit',    label: 'Edita',   icon: Scissors, color: 'text-amber-400'   },
    { key: 'publish', label: 'Publica', icon: Send,     color: 'text-emerald-400' },
  ]
  return (
    <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
      {rows.map(({ key, icon: Icon, color }) => {
        const block = tb[key]
        if (!block) return null
        return (
          <span key={key} className={`text-[10px] flex items-center gap-1 ${color}`}>
            <Icon size={9} />
            {DAY_SHORT[block.day]} {block.hour}
          </span>
        )
      })}
      <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
        <Clock size={9} /> {tb.daily_hours}h/día
      </span>
    </div>
  )
}

// ─── Client Form Modal ────────────────────────────────────────────────────────

function ClientModal({
  initial,
  onSave,
  onClose,
}: {
  initial: Partial<CmmClient>
  onSave: (data: Partial<CmmClient>) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<CmmClient>>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function patch(p: Partial<CmmClient>) { setForm(f => ({ ...f, ...p })) }

  function togglePlatform(p: string) {
    const curr = form.platforms ?? []
    patch({ platforms: curr.includes(p) ? curr.filter(x => x !== p) : [...curr, p] })
  }

  async function handleSave() {
    if (!form.name?.trim()) { setError('El nombre es requerido'); return }
    setSaving(true); setError(null)
    try { await onSave(form) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-xl rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-2)' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
            {initial.id ? 'Editar cliente' : 'Nuevo cliente CMM'}
          </h3>
        </div>
        <div className="px-6 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nombre <span className="text-red-400">*</span></label>
              <input className="input" value={form.name ?? ''} onChange={e => patch({ name: e.target.value })} placeholder="Empresa ABC" />
            </div>
            <div>
              <label className="label">Folder ID (Drive)</label>
              <input className="input" value={form.folder_id ?? ''} onChange={e => patch({ folder_id: e.target.value || null })} placeholder="1BxiMVs..." />
            </div>
            <div>
              <label className="label">WhatsApp CTA</label>
              <input className="input" value={form.whatsapp_cta ?? ''} onChange={e => patch({ whatsapp_cta: e.target.value || null })} placeholder="+1 809 555 0000" />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={form.is_own_brand ?? false} onChange={e => patch({ is_own_brand: e.target.checked })} />
              <div className={`w-9 h-5 rounded-full transition-colors ${form.is_own_brand ? 'bg-amber-500' : 'bg-gray-700'}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_own_brand ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
              <Star size={13} className={form.is_own_brand ? 'text-amber-400' : 'text-gray-600'} />
              Mi Marca (cuenta propia)
            </span>
          </label>

          <div>
            <label className="label">Voz de marca / Indicaciones</label>
            <textarea className="input resize-none" rows={3} value={form.brand_voice ?? ''} onChange={e => patch({ brand_voice: e.target.value || null })} placeholder="Tono profesional, directo, usa emojis con moderación..." />
          </div>

          <TimeBlocksSection
            value={form.time_blocks}
            onChange={tb => patch({ time_blocks: tb })}
          />

          <div>
            <label className="label mb-2">Plataformas activas</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map(p => {
                const active = (form.platforms ?? []).includes(p)
                const meta = PLATFORM_META[p]
                return (
                  <button key={p} type="button" onClick={() => togglePlatform(p)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${active ? meta.color : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}>
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          {(form.platforms ?? []).includes('facebook') && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>
              <p className="col-span-2 text-xs font-medium text-blue-400">Facebook</p>
              <div><label className="label">Page ID</label><input className="input" value={form.fb_page_id ?? ''} onChange={e => patch({ fb_page_id: e.target.value || null })} /></div>
              <div><label className="label">Token</label><input className="input" value={form.fb_token ?? ''} onChange={e => patch({ fb_token: e.target.value || null })} /></div>
            </div>
          )}

          {(form.platforms ?? []).includes('instagram') && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>
              <p className="text-xs font-medium text-pink-400 mb-2">Instagram</p>
              <div><label className="label">Account ID</label><input className="input" value={form.ig_account_id ?? ''} onChange={e => patch({ ig_account_id: e.target.value || null })} /></div>
            </div>
          )}

          {(form.platforms ?? []).includes('wordpress') && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>
              <p className="col-span-2 text-xs font-medium text-indigo-400">WordPress</p>
              <div className="col-span-2"><label className="label">URL</label><input className="input" value={form.wp_url ?? ''} onChange={e => patch({ wp_url: e.target.value || null })} placeholder="https://tusite.com" /></div>
              <div><label className="label">Usuario</label><input className="input" value={form.wp_user ?? ''} onChange={e => patch({ wp_user: e.target.value || null })} /></div>
              <div><label className="label">App Password</label><input type="password" className="input" value={form.wp_app_password ?? ''} onChange={e => patch({ wp_app_password: e.target.value || null })} /></div>
            </div>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={form.active ?? true} onChange={e => patch({ active: e.target.checked })} />
              <div className={`w-9 h-5 rounded-full transition-colors ${form.active ? 'bg-emerald-600' : 'bg-gray-700'}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.active ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm" style={{ color: 'var(--text-2)' }}>Cliente activo</span>
          </label>
        </div>
        <div className="px-6 py-4 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          {error && <span className="text-xs text-red-400 flex-1">{error}</span>}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Catalog Section ──────────────────────────────────────────────────────────

function CatalogSection({ client, onClientUpdated }: { client: CmmClient; onClientUpdated: (c: CmmClient) => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ nombre: '', descripcion: '', precio: '', whatsapp_msg: '' })
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!addForm.nombre.trim()) return
    setSaving(true)
    try {
      const item = await CmmService.addCatalogItem(client.id, {
        nombre: addForm.nombre,
        descripcion: addForm.descripcion || null,
        precio: addForm.precio || null,
        whatsapp_msg: addForm.whatsapp_msg || null,
      })
      onClientUpdated({ ...client, catalog: [...client.catalog, item] })
      setAddForm({ nombre: '', descripcion: '', precio: '', whatsapp_msg: '' })
      setShowAdd(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(item: CmmCatalogItem) {
    if (!window.confirm(`¿Eliminar "${item.nombre}"?`)) return
    await CmmService.deleteCatalogItem(client.id, item.id)
    onClientUpdated({ ...client, catalog: client.catalog.filter(i => i.id !== item.id) })
  }

  return (
    <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
          <Package size={11} /> Catálogo ({client.catalog.length})
        </p>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)} className="text-[11px] text-emerald-400 hover:text-emerald-300">+ Agregar</button>
        )}
      </div>

      {client.catalog.map(item => (
        <div key={item.id} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: 'var(--surface-2)' }}>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" style={{ color: 'var(--text-1)' }}>{item.nombre}</p>
            {item.precio && <p style={{ color: 'var(--text-3)' }}>{item.precio}</p>}
          </div>
          <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-400 flex-shrink-0"><Trash2 size={11} /></button>
        </div>
      ))}

      {showAdd && (
        <div className="space-y-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <input className="input text-xs" placeholder="Nombre del servicio *" value={addForm.nombre} onChange={e => setAddForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <input className="input text-xs" placeholder="Precio" value={addForm.precio} onChange={e => setAddForm(f => ({ ...f, precio: e.target.value }))} />
            <input className="input text-xs" placeholder="Mensaje WhatsApp" value={addForm.whatsapp_msg} onChange={e => setAddForm(f => ({ ...f, whatsapp_msg: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="btn-secondary text-xs flex-1">Cancelar</button>
            <button onClick={handleAdd} disabled={saving} className="btn-primary text-xs flex-1">{saving ? '...' : 'Agregar'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Client Card ──────────────────────────────────────────────────────────────

function ClientCard({
  client,
  onEdit,
  onDelete,
  onUpdated,
}: {
  client: CmmClient
  onEdit: () => void
  onDelete: () => void
  onUpdated: (c: CmmClient) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {client.is_own_brand && (
              <span className="badge border bg-amber-500/15 text-amber-400 border-amber-500/20 flex items-center gap-1">
                <Star size={9} /> Mi Marca
              </span>
            )}
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{client.name}</p>
            <span className={client.active ? 'badge badge-green' : 'badge badge-gray'}>
              {client.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {(client.platforms ?? []).map(p => {
              const meta = PLATFORM_META[p] ?? PLATFORM_META.otro
              return (
                <span key={p} className={`badge border text-[10px] ${meta.color}`}>{meta.label}</span>
              )
            })}
            {(client.platforms ?? []).length === 0 && (
              <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>Sin plataformas configuradas</span>
            )}
          </div>

          {client.time_blocks && <TimeBlocksBadge tb={client.time_blocks} />}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
            <Edit2 size={12} />
          </button>
          <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {client.brand_voice && (
        <p className="mt-2 text-[11px] line-clamp-2" style={{ color: 'var(--text-3)' }}>{client.brand_voice}</p>
      )}

      <button
        onClick={() => setExpanded(v => !v)}
        className="mt-3 flex items-center gap-1 text-[11px] transition-colors"
        style={{ color: 'var(--text-3)' }}
      >
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {client.catalog.length} item{client.catalog.length !== 1 ? 's' : ''} en catálogo
      </button>

      {expanded && (
        <CatalogSection client={client} onClientUpdated={onUpdated} />
      )}
    </div>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function ClientsTab({ onClientsChange }: { onClientsChange?: (clients: CmmClient[]) => void }) {
  const [clients, setClients] = useState<CmmClient[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; initial: Partial<CmmClient> }>({ open: false, initial: BLANK_CLIENT })

  useEffect(() => { load() }, [])

  function syncClients(updated: CmmClient[]) {
    setClients(updated)
    onClientsChange?.(updated)
  }

  async function load() {
    setLoading(true)
    try {
      const list = await CmmService.clients()
      setClients(list)
      onClientsChange?.(list)
    }
    finally { setLoading(false) }
  }

  async function handleSave(data: Partial<CmmClient>) {
    if (data.id) {
      const updated = await CmmService.updateClient(data.id, data)
      syncClients(clients.map(c => c.id === updated.id ? { ...c, ...updated } : c))
    } else {
      const created = await CmmService.createClient(data)
      syncClients([...clients, { ...created, catalog: [] }])
    }
    setModal({ open: false, initial: BLANK_CLIENT })
  }

  async function handleDelete(client: CmmClient) {
    if (!window.confirm(`¿Eliminar a "${client.name}"? Se eliminarán todos sus posts.`)) return
    await CmmService.deleteClient(client.id)
    syncClients(clients.filter(c => c.id !== client.id))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>Clientes CMM</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal({ open: true, initial: BLANK_CLIENT })} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Plus size={14} /> Nuevo Cliente
        </button>
      </div>

      {loading && (
        <div className="card p-12 text-center"><p className="text-sm" style={{ color: 'var(--text-3)' }}>Cargando clientes...</p></div>
      )}

      {!loading && clients.length === 0 && (
        <div className="card p-12 text-center">
          <Globe size={32} className="mx-auto mb-3 text-emerald-400 opacity-30" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Sin clientes CMM</p>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-3)' }}>Agrega tu primer cliente para empezar a gestionar su contenido</p>
          <button onClick={() => setModal({ open: true, initial: BLANK_CLIENT })} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus size={14} /> Nuevo Cliente
          </button>
        </div>
      )}

      {!loading && clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(c => (
            <ClientCard
              key={c.id}
              client={c}
              onEdit={() => setModal({ open: true, initial: c })}
              onDelete={() => handleDelete(c)}
              onUpdated={updated => setClients(prev => prev.map(x => x.id === updated.id ? updated : x))}
            />
          ))}
        </div>
      )}

      {modal.open && (
        <ClientModal
          initial={modal.initial}
          onSave={handleSave}
          onClose={() => setModal({ open: false, initial: BLANK_CLIENT })}
        />
      )}
    </div>
  )
}
