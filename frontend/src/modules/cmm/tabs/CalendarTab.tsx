import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Clock, Pencil, Trash2 } from 'lucide-react'
import { CmmService, type CmmClient, type CmmPost, type CmmPostStatus, type CmmPostTipo } from '@/lib/services/cmm.service'
import { TIPOS, tipoBadge, tipoLabel } from '../CmmPage'

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { value: 'facebook',  label: 'Facebook',  pill: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'instagram', label: 'Instagram', pill: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { value: 'whatsapp',  label: 'WhatsApp',  pill: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'wordpress', label: 'WordPress', pill: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { value: 'tiktok',    label: 'TikTok',    pill: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'linkedin',  label: 'LinkedIn',  pill: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  { value: 'otro',      label: 'Otro',      pill: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
]

const STATUS_META: Record<CmmPostStatus, { label: string; badge: string }> = {
  borrador:  { label: 'Borrador',  badge: 'badge badge-gray'  },
  aprobado:  { label: 'Aprobado',  badge: 'badge badge-amber' },
  publicado: { label: 'Publicado', badge: 'badge badge-green' },
  cancelado: { label: 'Cancelado', badge: 'badge badge-red'   },
}

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function platformPill(platform: string) {
  return PLATFORMS.find(p => p.value === platform)?.pill ?? PLATFORMS[PLATFORMS.length - 1].pill
}
function platformLabel(platform: string) {
  return PLATFORMS.find(p => p.value === platform)?.label ?? platform
}

function pad2(n: number) { return String(n).padStart(2, '0') }
function toYMD(year: number, month: number, day: number) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`
}

// ─── Post Form ────────────────────────────────────────────────────────────────

function PostForm({
  clients,
  initial,
  defaultDate,
  defaultClientId,
  onSave,
  onClose,
}: {
  clients: CmmClient[]
  initial?: CmmPost
  defaultDate: string
  defaultClientId?: number
  onSave: (post: CmmPost) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    cmm_client_id: initial?.cmm_client_id ?? defaultClientId ?? (clients[0]?.id ?? 0),
    platform:      initial?.platform ?? 'instagram',
    tipo:          (initial?.tipo ?? '') as CmmPostTipo | '',
    titulo:        initial?.titulo ?? '',
    contenido:     initial?.contenido ?? '',
    imagen_url:    initial?.imagen_url ?? '',
    fecha_programada: initial?.fecha_programada ?? defaultDate,
    hora_programada: initial?.hora_programada ?? '',
    status:        (initial?.status ?? 'borrador') as CmmPostStatus,
    notas:         initial?.notas ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function patch(p: Partial<typeof form>) { setForm(f => ({ ...f, ...p })) }

  async function handleSave() {
    if (!form.cmm_client_id) { setError('Selecciona un cliente'); return }
    setSaving(true); setError(null)
    try {
      const payload = {
        platform: form.platform,
        tipo: form.tipo || null,
        titulo: form.titulo || null,
        contenido: form.contenido || null,
        imagen_url: form.imagen_url || null,
        fecha_programada: form.fecha_programada,
        hora_programada: form.hora_programada || null,
        status: form.status,
        notas: form.notas || null,
      }
      let saved: CmmPost
      if (initial?.id) {
        saved = await CmmService.updatePost(initial.id, payload)
      } else {
        saved = await CmmService.createPost(form.cmm_client_id, payload)
      }
      onSave(saved)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Cliente <span className="text-red-400">*</span></label>
          <select className="input" value={form.cmm_client_id} onChange={e => patch({ cmm_client_id: Number(e.target.value) })} disabled={!!initial?.id}>
            <option value={0}>— Seleccionar —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Plataforma <span className="text-red-400">*</span></label>
          <select className="input" value={form.platform} onChange={e => patch({ platform: e.target.value })}>
            {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Fecha</label>
          <input type="date" className="input" value={form.fecha_programada} onChange={e => patch({ fecha_programada: e.target.value })} />
        </div>
        <div>
          <label className="label">Hora (opcional)</label>
          <input type="time" className="input" value={form.hora_programada} onChange={e => patch({ hora_programada: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="label">Tipo de contenido</label>
        <select className="input" value={form.tipo} onChange={e => patch({ tipo: e.target.value as CmmPostTipo | '' })}>
          <option value="">— Sin clasificar —</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Título / Copy corto</label>
        <input className="input" placeholder="Promo de fin de semana..." value={form.titulo} onChange={e => patch({ titulo: e.target.value })} />
      </div>

      <div>
        <label className="label">Contenido</label>
        <textarea className="input resize-none" rows={4} placeholder="Texto del post..." value={form.contenido} onChange={e => patch({ contenido: e.target.value })} />
      </div>

      <div>
        <label className="label">URL de imagen</label>
        <input className="input" placeholder="https://..." value={form.imagen_url} onChange={e => patch({ imagen_url: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Estado</label>
          <select className="input" value={form.status} onChange={e => patch({ status: e.target.value as CmmPostStatus })}>
            {(Object.keys(STATUS_META) as CmmPostStatus[]).map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Notas internas</label>
          <input className="input" placeholder="Recordatorio, referencia..." value={form.notas} onChange={e => patch({ notas: e.target.value })} />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ─── Day Panel ─────────────────────────────────────────────────────────────────

function DayPanel({
  date,
  posts,
  clients,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
}: {
  date: string
  posts: CmmPost[]
  clients: CmmClient[]
  defaultClientId?: number
  onClose: () => void
  onCreated: (p: CmmPost) => void
  onUpdated: (p: CmmPost) => void
  onDeleted: (id: number) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CmmPost | null>(null)

  const [d, m, y] = date.split('-').map(Number)
  const label = `${d} de ${MONTHS_ES[m - 1]} ${y}`

  async function handleDelete(post: CmmPost) {
    if (!window.confirm(`¿Eliminar "${post.titulo || platformLabel(post.platform)}"?`)) return
    await CmmService.deletePost(post.id)
    onDeleted(post.id)
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col shadow-2xl" style={{ backgroundColor: 'var(--surface)', borderLeft: '1px solid var(--border-2)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{label}</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{posts.length} publicación{posts.length !== 1 ? 'es' : ''}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {posts.length === 0 && !showForm && !editing && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-3)' }}>Sin publicaciones programadas</p>
        )}

        {posts.map(post => {
          if (editing?.id === post.id) {
            return (
              <div key={post.id} className="card-sm">
                <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-2)' }}>Editando publicación</p>
                <PostForm clients={clients} initial={post} defaultDate={date}
                  onSave={saved => { onUpdated(saved); setEditing(null) }}
                  onClose={() => setEditing(null)} />
              </div>
            )
          }
          const clientName = clients.find(c => c.id === post.cmm_client_id)?.name ?? post.client?.name ?? '—'
          return (
            <div key={post.id} className="card-sm space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge border text-[10px] ${platformPill(post.platform)}`}>{platformLabel(post.platform)}</span>
                  {post.tipo && (
                    <span className={`badge border text-[10px] ${tipoBadge(post.tipo)}`}>{tipoLabel(post.tipo)}</span>
                  )}
                  <span className={STATUS_META[post.status].badge}>{STATUS_META[post.status].label}</span>
                  <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                    {post.client?.is_own_brand && <span className="text-amber-400">★</span>}
                    {clientName}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditing(post)} className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors">
                    <Pencil size={11} />
                  </button>
                  <button onClick={() => handleDelete(post)} className="w-6 h-6 flex items-center justify-center rounded text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
              {post.hora_programada && (
                <p className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-3)' }}>
                  <Clock size={10} /> {post.hora_programada.slice(0, 5)}
                </p>
              )}
              {post.titulo && <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{post.titulo}</p>}
              {post.contenido && <p className="text-xs line-clamp-3" style={{ color: 'var(--text-2)' }}>{post.contenido}</p>}
            </div>
          )
        })}

        {showForm && !editing && (
          <div className="card-sm">
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-2)' }}>Nueva publicación</p>
            <PostForm clients={clients} defaultDate={date}
              onSave={saved => { onCreated(saved); setShowForm(false) }}
              onClose={() => setShowForm(false)} />
          </div>
        )}
      </div>

      {/* Footer */}
      {!showForm && !editing && (
        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => setShowForm(true)} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            <Plus size={14} /> Agregar publicación
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Calendar Tab ────────────────────────────────────────────────────────

export default function CalendarTab({ clients }: { clients: CmmClient[] }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed
  const [filterClientId, setFilterClientId] = useState<number | ''>('')
  const [posts, setPosts] = useState<CmmPost[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => { loadPosts() }, [year, month, filterClientId])

  async function loadPosts() {
    setLoading(true)
    try {
      const monthStr = `${year}-${pad2(month + 1)}`
      setPosts(await CmmService.posts({
        month: monthStr,
        ...(filterClientId ? { client_id: Number(filterClientId) } : {}),
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

  // Build calendar grid (Mon start)
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const startOffset = (firstDay + 6) % 7             // shift so Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  const cells: Array<{ day: number | null; date: string | null }> = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push({ day: null, date: null })
    } else {
      cells.push({ day: dayNum, date: toYMD(year, month, dayNum) })
    }
  }

  const postsByDate = posts.reduce<Record<string, CmmPost[]>>((acc, p) => {
    const d = p.fecha_programada
    if (!d) return acc
    if (!acc[d]) acc[d] = []
    acc[d].push(p)
    return acc
  }, {})

  const selectedPosts = selectedDate ? (postsByDate[selectedDate] ?? []) : []
  const todayStr = toYMD(now.getFullYear(), now.getMonth(), now.getDate())

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-semibold min-w-[160px] text-center" style={{ color: 'var(--text-1)' }}>
            {MONTHS_ES[month]} {year}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>

        <select
          className="input text-sm"
          style={{ width: 'auto', minWidth: '160px' }}
          value={filterClientId}
          onChange={e => setFilterClientId(e.target.value === '' ? '' : Number(e.target.value))}
        >
          <option value="">Todos los clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2 text-xs" style={{ color: 'var(--text-3)' }}>
          {loading && <span>Cargando...</span>}
          <span>{posts.length} publicación{posts.length !== 1 ? 'es' : ''} este mes</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="card overflow-hidden p-0">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
          {DAYS_ES.map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const cellPosts = cell.date ? (postsByDate[cell.date] ?? []) : []
            const isToday = cell.date === todayStr
            const isSelected = cell.date === selectedDate
            const isOtherMonth = cell.day === null

            return (
              <div
                key={i}
                onClick={() => cell.date && setSelectedDate(cell.date === selectedDate ? null : cell.date)}
                className={[
                  'min-h-[90px] p-2 border-b border-r cursor-pointer transition-colors',
                  i % 7 === 6 ? 'border-r-0' : '',
                  Math.floor(i / 7) === Math.floor((cells.length - 1) / 7) ? 'border-b-0' : '',
                  isOtherMonth ? 'opacity-30 cursor-default' : '',
                  isSelected ? 'bg-emerald-600/10' : 'hover:bg-white/[0.02]',
                ].join(' ')}
                style={{ borderColor: 'var(--border)' }}
              >
                {cell.day !== null && (
                  <>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={[
                        'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium',
                        isToday ? 'bg-emerald-600 text-white' : '',
                        !isToday ? '' : '',
                      ].join(' ')}
                        style={!isToday ? { color: 'var(--text-2)' } : undefined}
                      >
                        {cell.day}
                      </span>
                      {cellPosts.length > 0 && (
                        <span className="text-[10px] text-emerald-400 font-medium">{cellPosts.length}</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {cellPosts.slice(0, 3).map(p => (
                        <div key={p.id} className={`w-full rounded text-[10px] px-1 py-0.5 truncate border ${platformPill(p.platform)}`}>
                          {p.titulo || platformLabel(p.platform)}
                        </div>
                      ))}
                      {cellPosts.length > 3 && (
                        <p className="text-[10px] text-center" style={{ color: 'var(--text-3)' }}>+{cellPosts.length - 3} más</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {PLATFORMS.map(p => (
          <div key={p.value} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm border ${p.pill}`} />
            <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{p.label}</span>
          </div>
        ))}
      </div>

      {/* Day panel */}
      {selectedDate && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedDate(null)} />
          <DayPanel
            date={selectedDate}
            posts={selectedPosts}
            clients={clients}
            onClose={() => setSelectedDate(null)}
            onCreated={post => {
              setPosts(prev => [...prev, post])
            }}
            onUpdated={post => {
              setPosts(prev => prev.map(p => p.id === post.id ? post : p))
            }}
            onDeleted={id => {
              setPosts(prev => prev.filter(p => p.id !== id))
            }}
          />
        </>
      )}
    </div>
  )
}
