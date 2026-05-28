import { useEffect, useState } from 'react'
import { Plus, X, Trash2, Pencil, CalendarPlus, Lightbulb } from 'lucide-react'
import { CmmService, type CmmClient, type CmmPost, type CmmPostStatus, type CmmPostTipo } from '@/lib/services/cmm.service'
import { TIPOS, tipoBadge, tipoLabel } from '../CmmPage'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook',  label: 'Facebook'  },
  { value: 'tiktok',    label: 'TikTok'    },
  { value: 'whatsapp',  label: 'WhatsApp'  },
  { value: 'linkedin',  label: 'LinkedIn'  },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'otro',      label: 'Otro'      },
]

function ScheduleModal({ post, onSave, onClose }: {
  post: CmmPost
  onSave: (p: CmmPost) => void
  onClose: () => void
}) {
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!date) return
    setSaving(true)
    try {
      const updated = await CmmService.scheduleIdea(post.id, date)
      onSave(updated)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-2)' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Programar idea</h3>
            <p className="text-xs mt-0.5 truncate max-w-[220px]" style={{ color: 'var(--text-3)' }}>
              {post.titulo || tipoLabel(post.tipo) || post.platform}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200">
            <X size={13} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="label">Fecha de publicación</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} autoFocus />
          </div>
        </div>
        <div className="px-5 py-4 border-t flex gap-2 justify-end" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={!date || saving} className="btn-primary text-sm">
            <CalendarPlus size={14} /> {saving ? 'Programando...' : 'Programar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function IdeaForm({ clients, initial, onSave, onClose }: {
  clients: CmmClient[]
  initial?: CmmPost
  onSave: (p: CmmPost) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    cmm_client_id: initial?.cmm_client_id ?? (clients[0]?.id ?? 0),
    platform:  initial?.platform ?? 'instagram',
    tipo:      (initial?.tipo ?? '') as CmmPostTipo | '',
    titulo:    initial?.titulo ?? '',
    contenido: initial?.contenido ?? '',
    notas:     initial?.notas ?? '',
    status:    (initial?.status ?? 'borrador') as CmmPostStatus,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function patch(p: Partial<typeof form>) { setForm(f => ({ ...f, ...p })) }

  async function handleSave() {
    if (!form.cmm_client_id) { setError('Selecciona un cliente'); return }
    setSaving(true); setError(null)
    try {
      const payload = {
        platform:  form.platform,
        tipo:      form.tipo || null,
        titulo:    form.titulo || null,
        contenido: form.contenido || null,
        notas:     form.notas || null,
        status:    form.status,
        fecha_programada: null,
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
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.is_own_brand ? '★ ' : ''}{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Plataforma</label>
          <select className="input" value={form.platform} onChange={e => patch({ platform: e.target.value })}>
            {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
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
      <div>
        <label className="label">Título / Copy corto</label>
        <input className="input" placeholder="Idea de post..." value={form.titulo} onChange={e => patch({ titulo: e.target.value })} />
      </div>
      <div>
        <label className="label">Contenido</label>
        <textarea className="input resize-none" rows={3} placeholder="Descripción, ángulo, referencia..." value={form.contenido} onChange={e => patch({ contenido: e.target.value })} />
      </div>
      <div>
        <label className="label">Notas internas</label>
        <input className="input" placeholder="Inspiración, referencia, recurso..." value={form.notas} onChange={e => patch({ notas: e.target.value })} />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm">
          {saving ? 'Guardando...' : 'Guardar idea'}
        </button>
      </div>
    </div>
  )
}

export default function IdeasTab({ clients }: { clients: CmmClient[] }) {
  const [ideas, setIdeas] = useState<CmmPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CmmPost | null>(null)
  const [scheduling, setScheduling] = useState<CmmPost | null>(null)
  const [filterClient, setFilterClient] = useState<number | ''>('')
  const [filterTipo, setFilterTipo] = useState<CmmPostTipo | ''>('')

  useEffect(() => { load() }, [filterClient, filterTipo])

  async function load() {
    setLoading(true)
    try {
      setIdeas(await CmmService.ideas({
        ...(filterClient ? { client_id: Number(filterClient) } : {}),
        ...(filterTipo   ? { tipo: filterTipo }              : {}),
      }))
    } finally { setLoading(false) }
  }

  async function handleDelete(idea: CmmPost) {
    if (!window.confirm(`¿Eliminar "${idea.titulo || 'esta idea'}"?`)) return
    await CmmService.deletePost(idea.id)
    setIdeas(prev => prev.filter(i => i.id !== idea.id))
  }

  const clientName = (id: number) => clients.find(c => c.id === id)?.name ?? '—'
  const isOwn = (id: number) => clients.find(c => c.id === id)?.is_own_brand ?? false

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>Banco de Ideas</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Ideas sin fecha — programalas cuando estés listo</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Plus size={14} /> Nueva idea
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select className="input text-sm" style={{ width: 'auto', minWidth: '150px' }}
          value={filterClient} onChange={e => setFilterClient(e.target.value === '' ? '' : Number(e.target.value))}>
          <option value="">Todos los clientes</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.is_own_brand ? '★ ' : ''}{c.name}</option>
          ))}
        </select>
        <select className="input text-sm" style={{ width: 'auto', minWidth: '150px' }}
          value={filterTipo} onChange={e => setFilterTipo(e.target.value as CmmPostTipo | '')}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-3)' }}>
          {ideas.length} idea{ideas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {showForm && (
        <div className="card-sm">
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-2)' }}>Nueva idea</p>
          <IdeaForm
            clients={clients}
            onSave={idea => { setIdeas(prev => [idea, ...prev]); setShowForm(false) }}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center">
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>Cargando ideas...</p>
        </div>
      ) : ideas.length === 0 && !showForm ? (
        <div className="card p-12 text-center">
          <Lightbulb size={32} className="mx-auto mb-3 text-emerald-400 opacity-30" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Sin ideas guardadas</p>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-3)' }}>Captura ideas de contenido sin comprometerte a una fecha</p>
          <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus size={14} /> Nueva idea
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {ideas.map(idea => (
            <div key={idea.id}>
              {editing?.id === idea.id ? (
                <div className="card-sm">
                  <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-2)' }}>Editando idea</p>
                  <IdeaForm
                    clients={clients}
                    initial={idea}
                    onSave={updated => { setIdeas(prev => prev.map(i => i.id === updated.id ? updated : i)); setEditing(null) }}
                    onClose={() => setEditing(null)}
                  />
                </div>
              ) : (
                <div className="card-sm flex items-start gap-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${tipoBadge(idea.tipo).split(' ')[0]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isOwn(idea.cmm_client_id) && (
                        <span className="text-[10px] font-semibold text-emerald-400">★ Mi Marca</span>
                      )}
                      <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                        {clientName(idea.cmm_client_id)}
                      </span>
                      {idea.tipo && (
                        <span className={`badge border text-[10px] ${tipoBadge(idea.tipo)}`}>{tipoLabel(idea.tipo)}</span>
                      )}
                      <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                        {PLATFORMS.find(p => p.value === idea.platform)?.label ?? idea.platform}
                      </span>
                    </div>
                    {idea.titulo && (
                      <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-1)' }}>{idea.titulo}</p>
                    )}
                    {idea.contenido && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-3)' }}>{idea.contenido}</p>
                    )}
                    {idea.notas && (
                      <p className="text-[11px] mt-1 italic" style={{ color: 'var(--text-3)' }}>{idea.notas}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setScheduling(idea)} title="Programar al calendario"
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                      <CalendarPlus size={12} />
                    </button>
                    <button onClick={() => setEditing(idea)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => handleDelete(idea)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {scheduling && (
        <ScheduleModal
          post={scheduling}
          onSave={updated => {
            setIdeas(prev => prev.filter(i => i.id !== updated.id))
            setScheduling(null)
          }}
          onClose={() => setScheduling(null)}
        />
      )}
    </div>
  )
}
