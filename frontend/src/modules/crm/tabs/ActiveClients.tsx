import { useEffect, useState } from 'react'
import {
  Plus, Edit2, Trash2, Phone, Mail, MessageCircle,
  Megaphone, Code2, Bot, CheckCircle2, XCircle, X,
  DollarSign, Users, Clock, Video, Scissors, Send,
} from 'lucide-react'
import {
  AgencyService_ as Svc,
  type AgencyClient,
  type AgencyService,
} from '@/lib/services/agency.service'
import {
  type CmmTimeBlocks,
  type WeekDay,
} from '@/lib/services/cmm.service'

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_META: Record<AgencyService, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  cmm:              { label: 'Marketing / CMM', icon: Megaphone, color: 'text-pink-400',    bg: 'bg-pink-500/15 border-pink-500/20'    },
  desarrollo:       { label: 'Desarrollo',      icon: Code2,     color: 'text-sky-400',     bg: 'bg-sky-500/15 border-sky-500/20'     },
  automatizaciones: { label: 'Automatizaciones',icon: Bot,       color: 'text-violet-400',  bg: 'bg-violet-500/15 border-violet-500/20' },
}

const ALL_SERVICES: AgencyService[] = ['cmm', 'desarrollo', 'automatizaciones']

const DAYS: WeekDay[] = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const HOURS = Array.from({ length: 17 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)

const BLANK_TIME_BLOCKS: CmmTimeBlocks = {
  record:      { day: 'lunes',     hour: '10:00' },
  edit:        { day: 'martes',    hour: '14:00' },
  publish:     { day: 'miércoles', hour: '09:00' },
  daily_hours: 4,
}

const BLANK: Partial<AgencyClient> = {
  name: '', email: null, phone: null, whatsapp: null,
  plan_mensual: null, servicios: [], cmm_client_id: null,
  time_blocks: null, fecha_inicio: null, active: true, notas: null,
}

// ─── Time Blocks ──────────────────────────────────────────────────────────────

const BLOCKS_META: { key: 'record' | 'edit' | 'publish'; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'record',  label: 'Grabar',   icon: Video,    color: 'text-rose-400'    },
  { key: 'edit',    label: 'Editar',   icon: Scissors, color: 'text-amber-400'   },
  { key: 'publish', label: 'Publicar', icon: Send,     color: 'text-emerald-400' },
]

const DAY_SHORT: Record<WeekDay, string> = {
  'lunes': 'Lun', 'martes': 'Mar', 'miércoles': 'Mié',
  'jueves': 'Jue', 'viernes': 'Vie', 'sábado': 'Sáb', 'domingo': 'Dom',
}

function TimeBlocksSection({
  value,
  onChange,
}: {
  value: CmmTimeBlocks | null | undefined
  onChange: (tb: CmmTimeBlocks | null) => void
}) {
  const enabled = !!value
  const tb = value ?? BLANK_TIME_BLOCKS

  function patchBlock(key: 'record' | 'edit' | 'publish', field: 'day' | 'hour', val: string) {
    const current = tb[key] ?? { day: 'lunes', hour: '09:00' }
    onChange({ ...tb, [key]: { ...current, [field]: val } })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
          <Clock size={11} /> Horario semanal CMM
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
          {BLOCKS_META.map(({ key, label, icon: Icon, color }) => {
            const block = tb[key]
            return (
              <div key={key} className="grid grid-cols-[100px_1fr_1fr] items-center gap-2">
                <span className={`text-xs font-medium flex items-center gap-1.5 ${color}`}>
                  <Icon size={11} /> {label}
                </span>
                <select className="input text-xs py-1.5" value={block?.day ?? 'lunes'}
                  onChange={e => patchBlock(key, 'day', e.target.value)}>
                  {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
                <select className="input text-xs py-1.5" value={block?.hour ?? '09:00'}
                  onChange={e => patchBlock(key, 'hour', e.target.value)}>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            )
          })}
          <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>Horas diarias comprometidas:</span>
            <select className="input text-xs py-1 w-20" value={tb.daily_hours}
              onChange={e => onChange({ ...tb, daily_hours: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5, 6, 8].map(h => <option key={h} value={h}>{h}h</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

function TimeBlocksBadge({ tb }: { tb: CmmTimeBlocks }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
      {BLOCKS_META.map(({ key, icon: Icon, color }) => {
        const block = tb[key]
        if (!block) return null
        return (
          <span key={key} className={`text-[10px] flex items-center gap-1 ${color}`}>
            <Icon size={9} /> {DAY_SHORT[block.day]} {block.hour}
          </span>
        )
      })}
      <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
        <Clock size={9} /> {tb.daily_hours}h/día
      </span>
    </div>
  )
}

// ─── Client Modal ─────────────────────────────────────────────────────────────

function ClientModal({
  initial,
  onSave,
  onClose,
}: {
  initial: Partial<AgencyClient>
  onSave: (d: Partial<AgencyClient>) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<AgencyClient>>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  function patch(p: Partial<AgencyClient>) { setForm(f => ({ ...f, ...p })) }

  function toggleService(s: AgencyService) {
    const curr = form.servicios ?? []
    const next = curr.includes(s) ? curr.filter(x => x !== s) : [...curr, s]
    const update: Partial<AgencyClient> = { servicios: next }
    // Clear time_blocks if CMM is deselected
    if (s === 'cmm' && curr.includes('cmm')) update.time_blocks = null
    patch(update)
  }

  async function handleSave() {
    if (!form.name?.trim()) { setError('El nombre es requerido'); return }
    setSaving(true); setError(null)
    try { await onSave(form) }
    catch { setError('Error al guardar') }
    finally { setSaving(false) }
  }

  const hasCmm = (form.servicios ?? []).includes('cmm')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-2)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
            {initial.id ? 'Editar cliente' : 'Nuevo cliente activo'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
            <X size={15} className="text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[76vh] overflow-y-auto">

          {/* Nombre */}
          <div>
            <label className="label">Nombre / Empresa <span className="text-red-400">*</span></label>
            <input className="input" value={form.name ?? ''} onChange={e => patch({ name: e.target.value })} placeholder="Empresa ABC" />
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email ?? ''} onChange={e => patch({ email: e.target.value || null })} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={form.phone ?? ''} onChange={e => patch({ phone: e.target.value || null })} placeholder="+1 809..." />
            </div>
            <div>
              <label className="label">WhatsApp</label>
              <input className="input" value={form.whatsapp ?? ''} onChange={e => patch({ whatsapp: e.target.value || null })} placeholder="+1 809..." />
            </div>
          </div>

          {/* Plan mensual + Fecha inicio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Plan mensual (RD$)</label>
              <input
                type="number" min="0" className="input"
                value={form.plan_mensual ?? ''}
                onChange={e => patch({ plan_mensual: e.target.value ? e.target.value as any : null })}
                placeholder="5000"
              />
            </div>
            <div>
              <label className="label">Fecha de inicio</label>
              <input
                type="date" className="input"
                value={form.fecha_inicio ?? ''}
                onChange={e => patch({ fecha_inicio: e.target.value || null })}
              />
            </div>
          </div>

          {/* Servicios */}
          <div>
            <label className="label mb-2">Servicios contratados</label>
            <div className="flex flex-col gap-2">
              {ALL_SERVICES.map(s => {
                const meta = SERVICE_META[s]
                const Icon = meta.icon
                const active = (form.servicios ?? []).includes(s)
                return (
                  <label key={s} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${active ? meta.bg + ' border' : 'border-gray-700 hover:border-gray-600'}`}>
                    <input type="checkbox" className="sr-only" checked={active} onChange={() => toggleService(s)} />
                    <Icon size={15} className={active ? meta.color : 'text-gray-600'} />
                    <span className={`text-sm font-medium ${active ? meta.color : 'text-gray-500'}`}>{meta.label}</span>
                    {active && <CheckCircle2 size={14} className={`ml-auto ${meta.color}`} />}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Time blocks — solo cuando CMM está activo */}
          {hasCmm && (
            <TimeBlocksSection
              value={form.time_blocks}
              onChange={tb => patch({ time_blocks: tb })}
            />
          )}

          {/* Notas */}
          <div>
            <label className="label">Notas</label>
            <textarea
              className="input resize-none" rows={2}
              value={form.notas ?? ''}
              onChange={e => patch({ notas: e.target.value || null })}
              placeholder="Contexto del cliente, detalles del contrato..."
            />
          </div>

          {/* Estado */}
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

// ─── Client Card ─────────────────────────────────────────────────────────────

function ClientCard({
  client,
  onEdit,
  onDelete,
}: {
  client: AgencyClient
  onEdit: () => void
  onDelete: () => void
}) {
  const plan = client.plan_mensual ? parseFloat(client.plan_mensual) : null

  return (
    <div className={`card-sm flex flex-col gap-3 ${!client.active ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{client.name}</p>
            {client.active
              ? <span className="badge badge-green flex items-center gap-1"><CheckCircle2 size={9} /> Activo</span>
              : <span className="badge badge-gray flex items-center gap-1"><XCircle size={9} /> Inactivo</span>
            }
          </div>
          {/* Contacto */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {client.email && (
              <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                <Mail size={9} /> {client.email}
              </span>
            )}
            {client.phone && (
              <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                <Phone size={9} /> {client.phone}
              </span>
            )}
            {client.whatsapp && !client.phone && (
              <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                <MessageCircle size={9} /> {client.whatsapp}
              </span>
            )}
          </div>
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

      {/* Plan mensual */}
      {plan !== null && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg w-fit" style={{ backgroundColor: 'var(--surface-2)' }}>
          <DollarSign size={11} className="text-emerald-400" />
          <span className="text-xs font-mono font-semibold text-emerald-400">
            RD$ {plan.toLocaleString()}<span className="text-gray-500 font-normal">/mes</span>
          </span>
        </div>
      )}

      {/* Servicios */}
      {(client.servicios ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(client.servicios ?? []).map(s => {
            const meta = SERVICE_META[s]
            const Icon = meta.icon
            return (
              <span key={s} className={`badge border flex items-center gap-1 ${meta.bg} ${meta.color}`}>
                <Icon size={9} /> {meta.label}
              </span>
            )
          })}
        </div>
      )}

      {/* Time blocks para clientes CMM */}
      {client.time_blocks && (client.servicios ?? []).includes('cmm') && (
        <TimeBlocksBadge tb={client.time_blocks} />
      )}

      {/* Notas */}
      {client.notas && (
        <p className="text-[11px] line-clamp-2" style={{ color: 'var(--text-3)' }}>{client.notas}</p>
      )}

      {/* Fecha inicio */}
      {client.fecha_inicio && (
        <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
          Cliente desde {client.fecha_inicio}
        </p>
      )}
    </div>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function ActiveClients() {
  const [clients, setClients] = useState<AgencyClient[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState<{ open: boolean; initial: Partial<AgencyClient> }>({ open: false, initial: BLANK })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setClients(await Svc.list()) }
    finally { setLoading(false) }
  }

  async function handleSave(data: Partial<AgencyClient>) {
    if (data.id) {
      const updated = await Svc.update(data.id, data)
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
    } else {
      const created = await Svc.create(data)
      setClients(prev => [...prev, created])
    }
    setModal({ open: false, initial: BLANK })
  }

  async function handleDelete(client: AgencyClient) {
    if (!window.confirm(`¿Eliminar a "${client.name}"?`)) return
    await Svc.remove(client.id)
    setClients(prev => prev.filter(c => c.id !== client.id))
  }

  const active   = clients.filter(c => c.active)
  const mrr      = active.reduce((sum, c) => sum + (parseFloat(c.plan_mensual ?? '0') || 0), 0)

  return (
    <div className="space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Clientes activos</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{active.length}</p>
        </div>
        <div className="card py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>MRR mensual</p>
          <p className="text-2xl font-bold text-emerald-400">RD$ {mrr.toLocaleString()}</p>
        </div>
        <div className="card py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Total clientes</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{clients.length}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          Clientes que ya te pagan mensualmente con servicios asignados
        </p>
        <button
          onClick={() => setModal({ open: true, initial: BLANK })}
          className="btn-primary text-xs py-1.5"
        >
          <Plus size={13} /> Nuevo cliente
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div className="card p-12 text-center">
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>Cargando...</p>
        </div>
      )}

      {!loading && clients.length === 0 && (
        <div className="card p-16 text-center">
          <Users size={32} className="mx-auto mb-3 text-emerald-400 opacity-30" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Sin clientes registrados</p>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-3)' }}>Registra los clientes que ya te pagan mensualmente</p>
          <button onClick={() => setModal({ open: true, initial: BLANK })} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus size={14} /> Agregar primer cliente
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
            />
          ))}
        </div>
      )}

      {modal.open && (
        <ClientModal
          initial={modal.initial}
          onSave={handleSave}
          onClose={() => setModal({ open: false, initial: BLANK })}
        />
      )}
    </div>
  )
}
