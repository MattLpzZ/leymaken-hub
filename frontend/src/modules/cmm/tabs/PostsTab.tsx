import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Trash2, Pencil, Plus, X } from 'lucide-react'
import { CmmService, type CmmClient, type CmmPost, type CmmPostStatus, type CmmPostTipo } from '@/lib/services/cmm.service'
import { TIPOS, tipoBadge, tipoLabel } from '../CmmPage'

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { value: 'facebook',  label: 'Facebook'  },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp',  label: 'WhatsApp'  },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'tiktok',    label: 'TikTok'    },
  { value: 'linkedin',  label: 'LinkedIn'  },
  { value: 'otro',      label: 'Otro'      },
]

const PLATFORM_PILL: Record<string, string> = {
  facebook:  'bg-blue-500/15 text-blue-400 border-blue-500/20',
  instagram: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  whatsapp:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  wordpress: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  tiktok:    'bg-red-500/15 text-red-400 border-red-500/20',
  linkedin:  'bg-sky-500/15 text-sky-400 border-sky-500/20',
  otro:      'bg-gray-500/15 text-gray-400 border-gray-500/20',
}

const STATUS_META: Record<CmmPostStatus, { label: string; badge: string }> = {
  borrador:  { label: 'Borrador',  badge: 'badge badge-gray'  },
  aprobado:  { label: 'Aprobado',  badge: 'badge badge-amber' },
  publicado: { label: 'Publicado', badge: 'badge badge-green' },
  cancelado: { label: 'Cancelado', badge: 'badge badge-red'   },
}

const STATUS_NEXT: Record<CmmPostStatus, CmmPostStatus> = {
  borrador:  'aprobado',
  aprobado:  'publicado',
  publicado: 'publicado',
  cancelado: 'borrador',
}

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function pad2(n: number) { return String(n).padStart(2, '0') }

// ─── Inline Edit Modal ────────────────────────────────────────────────────────

function EditModal({
  post,
  clients,
  onSave,
  onClose,
}: {
  post: CmmPost
  clients: CmmClient[]
  onSave: (p: CmmPost) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    platform: post.platform,
    tipo: post.tipo ?? '' as CmmPostTipo | '',
    titulo: post.titulo ?? '',
    contenido: post.contenido ?? '',
    imagen_url: post.imagen_url ?? '',
    fecha_programada: post.fecha_programada ?? '',
    hora_programada: post.hora_programada ?? '',
    status: post.status,
    notas: post.notas ?? '',
  })
  const [saving, setSaving] = useState(false)

  function patch(p: Partial<typeof form>) { setForm(f => ({ ...f, ...p })) }

  async function handleSave() {
    setSaving(true)
    try {
      const saved = await CmmService.updatePost(post.id, {
        platform: form.platform,
        tipo: form.tipo || null,
        titulo: form.titulo || null,
        contenido: form.contenido || null,
        imagen_url: form.imagen_url || null,
        fecha_programada: form.fecha_programada || null,
        hora_programada: form.hora_programada || null,
        status: form.status,
        notas: form.notas || null,
      })
      onSave(saved)
    } finally { setSaving(false) }
  }

  const clientName = clients.find(c => c.id === post.cmm_client_id)?.name ?? post.client?.name ?? '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-2)' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Editar publicación</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{clientName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 transition-colors">
            <X size={13} />
          </button>
        </div>
        <div className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Plataforma</label>
              <select className="input" value={form.platform} onChange={e => patch({ platform: e.target.value })}>
                {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.status} onChange={e => patch({ status: e.target.value as CmmPostStatus })}>
                {(Object.keys(STATUS_META) as CmmPostStatus[]).map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Tipo de contenido</label>
            <select className="input" value={form.tipo} onChange={e => patch({ tipo: e.target.value as CmmPostTipo | '' })}>
              <option value="">— Sin clasificar —</option>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha</label>
              <input type="date" className="input" value={form.fecha_programada} onChange={e => patch({ fecha_programada: e.target.value })} />
            </div>
            <div>
              <label className="label">Hora</label>
              <input type="time" className="input" value={form.hora_programada} onChange={e => patch({ hora_programada: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Título</label>
            <input className="input" value={form.titulo} onChange={e => patch({ titulo: e.target.value })} />
          </div>
          <div>
            <label className="label">Contenido</label>
            <textarea className="input resize-none" rows={4} value={form.contenido} onChange={e => patch({ contenido: e.target.value })} />
          </div>
          <div>
            <label className="label">Notas</label>
            <input className="input" value={form.notas} onChange={e => patch({ notas: e.target.value })} />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex gap-2 justify-end" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function PostsTab({ clients }: { clients: CmmClient[] }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [filterClientId, setFilterClientId] = useState<number | ''>('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterStatus, setFilterStatus] = useState<CmmPostStatus | ''>('')
  const [filterTipo, setFilterTipo] = useState<CmmPostTipo | ''>('')
  const [posts, setPosts] = useState<CmmPost[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<CmmPost | null>(null)

  useEffect(() => { loadPosts() }, [year, month, filterClientId, filterPlatform, filterStatus, filterTipo])

  async function loadPosts() {
    setLoading(true)
    try {
      setPosts(await CmmService.posts({
        month: `${year}-${pad2(month + 1)}`,
        ...(filterClientId ? { client_id: Number(filterClientId) } : {}),
        ...(filterPlatform ? { platform: filterPlatform } : {}),
        ...(filterStatus   ? { status: filterStatus }     : {}),
        ...(filterTipo     ? { tipo: filterTipo }         : {}),
      }))
    } finally { setLoading(false) }
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  async function handleStatusAdvance(post: CmmPost) {
    const next = STATUS_NEXT[post.status]
    if (next === post.status) return
    const updated = await CmmService.updatePostStatus(post.id, next)
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  async function handleDelete(post: CmmPost) {
    if (!window.confirm(`¿Eliminar "${post.titulo || post.platform}"?`)) return
    await CmmService.deletePost(post.id)
    setPosts(prev => prev.filter(p => p.id !== post.id))
  }

  // Stats
  const stats = (Object.keys(STATUS_META) as CmmPostStatus[]).map(s => ({
    ...STATUS_META[s],
    count: posts.filter(p => p.status === s).length,
  }))

  return (
    <div className="space-y-5">
      {/* Month nav + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-semibold min-w-[150px] text-center" style={{ color: 'var(--text-1)' }}>
            {MONTHS_ES[month]} {year}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>

        <select className="input text-sm" style={{ width: 'auto', minWidth: '140px' }} value={filterClientId} onChange={e => setFilterClientId(e.target.value === '' ? '' : Number(e.target.value))}>
          <option value="">Todos los clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select className="input text-sm" style={{ width: 'auto' }} value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}>
          <option value="">Todas las plataformas</option>
          {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        <select className="input text-sm" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value as CmmPostStatus | '')}>
          <option value="">Todos los estados</option>
          {(Object.keys(STATUS_META) as CmmPostStatus[]).map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>

        <select className="input text-sm" style={{ width: 'auto' }} value={filterTipo} onChange={e => setFilterTipo(e.target.value as CmmPostTipo | '')}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="card-sm text-center">
            <p className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>{s.count}</p>
            <span className={s.badge + ' mt-1'}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="text-sm text-center py-12" style={{ color: 'var(--text-3)' }}>Cargando publicaciones...</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Plus size={28} className="mx-auto mb-3 text-emerald-400 opacity-30" />
            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Sin publicaciones este mes</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Usa el Calendario para programar contenido</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="table-header text-left pl-4 py-3">Fecha</th>
                <th className="table-header text-left py-3">Cliente</th>
                <th className="table-header text-left py-3">Plataforma</th>
                <th className="table-header text-left py-3">Tipo</th>
                <th className="table-header text-left py-3">Contenido</th>
                <th className="table-header text-left py-3">Estado</th>
                <th className="table-header text-right pr-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => {
                const clientName = clients.find(c => c.id === post.cmm_client_id)?.name ?? post.client?.name ?? '—'
                const pillClass = PLATFORM_PILL[post.platform] ?? PLATFORM_PILL.otro
                const platformName = PLATFORMS.find(p => p.value === post.platform)?.label ?? post.platform
                const canAdvance = STATUS_NEXT[post.status] !== post.status

                return (
                  <tr key={post.id} className="table-row border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="table-cell pl-4 py-3 whitespace-nowrap">
                      <p className="text-xs font-mono">{post.fecha_programada}</p>
                      {post.hora_programada && (
                        <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{post.hora_programada.slice(0, 5)}</p>
                      )}
                    </td>
                    <td className="table-cell py-3">
                      <div className="flex items-center gap-1.5">
                        {post.client?.is_own_brand && (
                          <span className="text-amber-400 text-[10px]">★</span>
                        )}
                        <span className="text-xs">{clientName}</span>
                      </div>
                    </td>
                    <td className="table-cell py-3">
                      <span className={`badge border text-[10px] ${pillClass}`}>{platformName}</span>
                    </td>
                    <td className="table-cell py-3">
                      {post.tipo
                        ? <span className={`badge border text-[10px] ${tipoBadge(post.tipo)}`}>{tipoLabel(post.tipo)}</span>
                        : <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>—</span>
                      }
                    </td>
                    <td className="table-cell py-3 max-w-[220px]">
                      {post.titulo && <p className="text-xs font-medium truncate" style={{ color: 'var(--text-1)' }}>{post.titulo}</p>}
                      {post.contenido && <p className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>{post.contenido}</p>}
                    </td>
                    <td className="table-cell py-3">
                      <button
                        onClick={() => handleStatusAdvance(post)}
                        title={canAdvance ? `Avanzar a ${STATUS_META[STATUS_NEXT[post.status]].label}` : undefined}
                        className={canAdvance ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}
                      >
                        <span className={STATUS_META[post.status].badge}>{STATUS_META[post.status].label}</span>
                      </button>
                    </td>
                    <td className="table-cell py-3 pr-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setEditing(post)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => handleDelete(post)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <EditModal
          post={editing}
          clients={clients}
          onSave={updated => {
            setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
