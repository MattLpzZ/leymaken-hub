import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Bell, CheckCircle, Clock, AlertCircle, Trash2, CalendarDays,
  Repeat2, FolderKanban, Building2, Loader2, X,
  ChevronLeft, ChevronRight, Video, Scissors, Send, Users,
} from 'lucide-react'
import Badge from '@/components/Badge'
import { AgendaService, type Reminder } from '@/lib/services/agenda.service'
import { AgencyService_, type AgencyClient } from '@/lib/services/agency.service'
import type { CmmTimeBlocks, WeekDay } from '@/lib/services/cmm.service'

const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const DAY_SHORT = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

const DAY_TO_IDX: Record<WeekDay, number> = {
  lunes: 0, martes: 1, 'miércoles': 2, jueves: 3, viernes: 4, sábado: 5, domingo: 6,
}

function getWeekDates(offset: number): Date[] {
  const today = new Date()
  const dow = today.getDay()
  const toMonday = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + toMonday + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isToday(d: Date): boolean {
  const t = new Date()
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}

function formatWeekRange(dates: Date[]): string {
  const first = dates[0], last = dates[6]
  const year = first.getFullYear()
  if (first.getMonth() === last.getMonth()) {
    return `del ${first.getDate()} al ${last.getDate()} de ${MONTHS_ES[first.getMonth()]} · ${year}`
  }
  return `del ${first.getDate()} de ${MONTHS_ES[first.getMonth()]} al ${last.getDate()} de ${MONTHS_ES[last.getMonth()]} · ${year}`
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

type BlockKey = 'record' | 'edit' | 'publish'

const BLOCK_META: Record<BlockKey, { label: string; icon: React.ElementType; color: string; dot: string }> = {
  record:  { label: 'Grabar',   icon: Video,    color: 'text-rose-400',    dot: 'bg-rose-400'    },
  edit:    { label: 'Editar',   icon: Scissors, color: 'text-amber-400',   dot: 'bg-amber-400'   },
  publish: { label: 'Publicar', icon: Send,     color: 'text-emerald-400', dot: 'bg-emerald-400' },
}

const CLIENT_COLORS = [
  'border-l-blue-400',   'border-l-purple-400', 'border-l-pink-400',
  'border-l-orange-400', 'border-l-teal-400',   'border-l-yellow-400',
  'border-l-indigo-400', 'border-l-cyan-400',   'border-l-rose-300',
]

interface DayTask {
  client: AgencyClient
  blockKey: BlockKey
  hour: string
}

function getTasksForDay(clients: AgencyClient[], dayIdx: number): DayTask[] {
  const tasks: DayTask[] = []
  for (const client of clients) {
    if (!client.time_blocks || !client.active) continue
    const tb = client.time_blocks as CmmTimeBlocks
    const blocks: BlockKey[] = ['record', 'edit', 'publish']
    for (const key of blocks) {
      const block = tb[key]
      if (block && DAY_TO_IDX[block.day] === dayIdx) {
        tasks.push({ client, blockKey: key, hour: block.hour })
      }
    }
  }
  return tasks.sort((a, b) => a.hour.localeCompare(b.hour))
}

function getTotalHoursPerDay(clients: AgencyClient[], dayIdx: number): number {
  let total = 0
  for (const client of clients) {
    if (!client.time_blocks || !client.active) continue
    const tb = client.time_blocks as CmmTimeBlocks
    const blocks: BlockKey[] = ['record', 'edit', 'publish']
    const hasTask = blocks.some(key => {
      const block = tb[key]
      return block && DAY_TO_IDX[block.day] === dayIdx
    })
    if (hasTask) total += tb.daily_hours ?? 0
  }
  return total
}

function SemanaView() {
  const [weekOffset, setWeekOffset]   = useState(0)
  const [clients, setClients]         = useState<AgencyClient[]>([])
  const [loading, setLoading]         = useState(true)
  const [checked, setChecked]         = useState<Record<string, boolean>>({})

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const weekStart = toDateStr(weekDates[0])

  useEffect(() => {
    AgencyService_.list()
      .then(list => setClients(list.filter(c => c.active && c.time_blocks)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(`agenda-semana-${weekStart}`)
    setChecked(stored ? JSON.parse(stored) : {})
  }, [weekStart])

  function toggle(key: string) {
    const next = { ...checked, [key]: !checked[key] }
    setChecked(next)
    localStorage.setItem(`agenda-semana-${weekStart}`, JSON.stringify(next))
  }

  const clientsWithSchedule = clients.filter(c => c.time_blocks)
  const totalWeekHours = clientsWithSchedule.reduce((sum, c) => {
    if (!c.time_blocks) return sum
    const tb = c.time_blocks as CmmTimeBlocks
    const days = new Set<number>()
    ;(['record','edit','publish'] as BlockKey[]).forEach(key => {
      const block = tb[key]
      if (block) days.add(DAY_TO_IDX[block.day])
    })
    return sum + days.size * (tb.daily_hours ?? 0)
  }, 0)

  const doneCount = Object.values(checked).filter(Boolean).length
  const totalTasks = clientsWithSchedule.reduce((sum, c) => {
    if (!c.time_blocks) return sum
    const tb = c.time_blocks as CmmTimeBlocks
    return sum + (['record','edit','publish'] as BlockKey[]).filter(k => tb[k]).length
  }, 0)

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <p className="text-sm font-medium capitalize" style={{ color: 'var(--text-1)' }}>
            {formatWeekRange(weekDates)}
          </p>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-800 text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              Hoy
            </button>
          )}
          <div className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-3)' }}>
            {doneCount}/{totalTasks} completadas · {totalWeekHours}h comprometidas
          </div>
        </div>
      </div>

      {!loading && clientsWithSchedule.length === 0 && (
        <div className="card p-12 text-center">
          <Users size={28} className="mx-auto mb-3 text-gray-700" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Sin horarios configurados</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            Ve a Clientes → edita un cliente con servicio CMM y activa el horario semanal
          </p>
        </div>
      )}

      {!loading && clientsWithSchedule.length > 0 && (
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-7 gap-2" style={{ minWidth: '700px' }}>
            {weekDates.map((date, dayIdx) => {
              const todayFlag = isToday(date)
              const tasks = getTasksForDay(clients, dayIdx)
              const dayHours = getTotalHoursPerDay(clients, dayIdx)

              return (
                <div
                  key={dayIdx}
                  className={`rounded-xl p-3 flex flex-col gap-2 ${todayFlag ? 'ring-1 ring-emerald-500/40' : ''}`}
                  style={{
                    backgroundColor: todayFlag ? 'color-mix(in srgb, var(--surface) 90%, #10b981 10%)' : 'var(--surface)',
                    border: todayFlag ? undefined : '1px solid var(--border)',
                  }}
                >
                  <div className="text-center pb-1 border-b" style={{ borderColor: 'var(--border)' }}>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${todayFlag ? 'text-emerald-400' : ''}`}
                       style={!todayFlag ? { color: 'var(--text-3)' } : {}}>
                      {DAY_SHORT[dayIdx]}
                    </p>
                    <p className={`text-base font-bold leading-tight ${todayFlag ? 'text-emerald-400' : ''}`}
                       style={!todayFlag ? { color: 'var(--text-1)' } : {}}>
                      {date.getDate()}
                    </p>
                    {dayHours > 0 && (
                      <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-3)' }}>{dayHours}h</p>
                    )}
                  </div>

                  {tasks.length === 0 && (
                    <p className="text-[10px] text-center py-3" style={{ color: 'var(--text-3)' }}>—</p>
                  )}

                  {tasks.map(({ client, blockKey, hour }) => {
                    const meta = BLOCK_META[blockKey]
                    const Icon = meta.icon
                    const taskKey = `${weekStart}-${client.id}-${blockKey}`
                    const done = !!checked[taskKey]
                    const colorClass = CLIENT_COLORS[client.id % CLIENT_COLORS.length]

                    return (
                      <button
                        key={taskKey}
                        onClick={() => toggle(taskKey)}
                        className={`w-full text-left p-2 rounded-lg border-l-2 transition-all ${colorClass} ${
                          done ? 'opacity-35' : 'hover:bg-gray-800/50'
                        }`}
                        style={{
                          backgroundColor: done ? 'transparent' : 'var(--surface-2)',
                          border: `1px solid var(--border)`,
                          borderLeftWidth: '2px',
                        }}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <Icon size={9} className={done ? 'text-gray-600' : meta.color} />
                          <span className={`text-[9px] font-semibold uppercase tracking-wider ${done ? 'text-gray-600' : meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className={`text-[11px] font-medium leading-tight truncate ${done ? 'line-through text-gray-600' : ''}`}
                           style={!done ? { color: 'var(--text-1)' } : {}}>
                          {client.name}
                        </p>
                        <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-3)' }}>{hour}</p>
                        {done && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle size={9} className="text-emerald-500" />
                            <span className="text-[9px] text-emerald-500">Hecho</span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!loading && clientsWithSchedule.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {clientsWithSchedule.map(c => (
            <div key={c.id} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${CLIENT_COLORS[c.id % CLIENT_COLORS.length].replace('border-l-','bg-')}`} />
              <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{c.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type ReminderType = 'renovacion' | 'reunion' | 'deadline' | 'cobro' | 'tarea' | 'otro'
type DisplayStatus = 'pendiente' | 'vencido' | 'completado' | 'descartado'

const typeConfig: Record<ReminderType, { label: string; icon: React.ElementType; color: string; badge: 'blue'|'green'|'red'|'amber'|'purple'|'gray' }> = {
  renovacion: { label: 'Renovación', icon: Repeat2,       color: 'text-blue-400',   badge: 'blue'   },
  reunion:    { label: 'Reunión',    icon: CalendarDays,  color: 'text-purple-400', badge: 'purple' },
  deadline:   { label: 'Deadline',   icon: AlertCircle,   color: 'text-red-400',    badge: 'red'    },
  cobro:      { label: 'Cobro',      icon: Building2,     color: 'text-emerald-400',badge: 'green'  },
  tarea:      { label: 'Tarea',      icon: FolderKanban,  color: 'text-amber-400',  badge: 'amber'  },
  otro:       { label: 'Otro',       icon: Bell,          color: 'text-gray-400',   badge: 'gray'   },
}

const BLANK_R = { title: '', description: '', type: 'tarea' as ReminderType, due_date: '', related_to: '' }

function daysFrom(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due   = new Date(dateStr); due.setHours(0, 0, 0, 0)
  const diff  = Math.ceil((due.getTime() - today.getTime()) / 86400000)
  if (diff < 0)   return { label: `hace ${Math.abs(diff)}d`, urgent: true  }
  if (diff === 0) return { label: 'Hoy',                     urgent: true  }
  if (diff === 1) return { label: 'Mañana',                  urgent: true  }
  if (diff <= 7)  return { label: `en ${diff}d`,             urgent: true  }
  return { label: `en ${diff}d`, urgent: false }
}

function displayStatus(r: Reminder): DisplayStatus {
  if (r.status !== 'pendiente') return r.status as DisplayStatus
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due   = new Date(r.due_date); due.setHours(0, 0, 0, 0)
  return due < today ? 'vencido' : 'pendiente'
}

function RecordatoriosView() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(BLANK_R)
  const [filter, setFilter]       = useState<DisplayStatus | 'all'>('pendiente')
  const [editReminder, setEditReminder] = useState<Reminder | null>(null)
  const [editForm, setEditForm]         = useState(BLANK_R)
  const [editSaving, setEditSaving]     = useState(false)

  useEffect(() => {
    AgendaService.list()
      .then(setReminders)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await AgendaService.create({ ...form, status: 'pendiente' })
      setReminders(prev => [...prev, created])
      setForm(BLANK_R)
      setShowForm(false)
    } catch { console.error('Error creating reminder') }
    finally { setSaving(false) }
  }

  const complete = async (id: number) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'completado' as const } : r))
    try { await AgendaService.complete(id) } catch { /* optimistic */ }
  }

  const remove = async (id: number) => {
    setReminders(prev => prev.filter(r => r.id !== id))
    try { await AgendaService.remove(id) } catch { /* optimistic */ }
  }

  const openEdit = (r: Reminder) => {
    setEditReminder(r)
    setEditForm({ title: r.title, description: r.description ?? '', type: r.type as ReminderType, due_date: r.due_date, related_to: r.related_to ?? '' })
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editReminder) return
    setEditSaving(true)
    try {
      const updated = await AgendaService.update(editReminder.id!, editForm)
      setReminders(prev => prev.map(r => r.id === editReminder.id ? updated : r))
      setEditReminder(null)
    } catch { console.error('Error updating reminder') }
    finally { setEditSaving(false) }
  }

  const pending  = reminders.filter(r => r.status === 'pendiente')
  const overdue  = reminders.filter(r => displayStatus(r) === 'vencido')
  const urgent   = reminders.filter(r => {
    if (r.status !== 'pendiente') return false
    return daysFrom(r.due_date).urgent
  }).length

  const displayed = reminders
    .filter(r => filter === 'all' ? true : displayStatus(r) === filter)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  const grouped = displayed.reduce<Record<string, Reminder[]>>((acc, r) => {
    const key = r.due_date.slice(0, 7)
    ;(acc[key] = acc[key] || []).push(r)
    return acc
  }, {})

  const monthLabel = (key: string) => {
    const [y, m] = key.split('-')
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={22} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      <div className="grid grid-cols-3 gap-4">
        <div className="card py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Pendientes</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{pending.length}</p>
        </div>
        <div className={`card py-3 space-y-1 ${urgent > 0 ? 'border-amber-500/20' : ''}`}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Urgentes (≤7d)</p>
          <p className={`text-2xl font-bold ${urgent > 0 ? 'text-amber-400' : 'text-gray-500'}`}>{urgent}</p>
        </div>
        <div className={`card py-3 space-y-1 ${overdue.length > 0 ? 'border-red-500/20' : ''}`}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Vencidos</p>
          <p className={`text-2xl font-bold ${overdue.length > 0 ? 'text-red-400' : 'text-gray-500'}`}>{overdue.length}</p>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            <span className="text-red-400 font-semibold">{overdue.length} recordatorio{overdue.length > 1 ? 's' : ''} vencido{overdue.length > 1 ? 's' : ''}</span>
            {' '}— {overdue.map(r => r.title).join(', ')}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['pendiente','vencido','completado','all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filter===f ? 'bg-emerald-600/15 border-emerald-500/25 text-emerald-400' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}>
              {f === 'all' ? 'Todos' : f === 'pendiente' ? 'Pendientes' : f === 'vencido' ? 'Vencidos' : 'Completados'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs py-1.5">
          <Plus size={13} /> Nuevo recordatorio
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Nuevo recordatorio</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Título</label>
                <input required className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ReminderType }))}>
                    {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Fecha límite</label>
                  <input required type="date" className="input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Descripción</label>
                <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Relacionado con</label>
                <input className="input" placeholder="CRM · Cliente, Proyectos · Nombre..." value={form.related_to} onChange={e => setForm(f => ({ ...f, related_to: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2" disabled={saving}>
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Editar recordatorio</h3>
              <button onClick={() => setEditReminder(null)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Título</label>
                <input required className="input" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value as ReminderType }))}>
                    {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Fecha límite</label>
                  <input required type="date" className="input" value={editForm.due_date} onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Descripción</label>
                <input className="input" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Relacionado con</label>
                <input className="input" value={editForm.related_to} onChange={e => setEditForm(f => ({ ...f, related_to: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { remove(editReminder.id!); setEditReminder(null) }}
                  className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={14} />
                </button>
                {editReminder.status === 'pendiente' && (
                  <button type="button" onClick={() => { complete(editReminder.id!); setEditReminder(null) }}
                    className="p-2 rounded-lg text-gray-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                    <CheckCircle size={14} />
                  </button>
                )}
                <div className="flex-1" />
                <button type="button" onClick={() => setEditReminder(null)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary disabled:opacity-50 flex items-center gap-2" disabled={editSaving}>
                  {editSaving && <Loader2 size={13} className="animate-spin" />}
                  {editSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-12">
          <Clock size={28} className="mx-auto text-gray-600 mb-3" />
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>No hay recordatorios en esta vista</p>
        </div>
      ) : (
        Object.entries(grouped).map(([month, items]) => (
          <div key={month} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider capitalize" style={{ color: 'var(--text-3)' }}>
              {monthLabel(month)}
            </p>
            {items.map(r => {
              const tc     = typeConfig[r.type as ReminderType] ?? typeConfig.otro
              const Icon   = tc.icon
              const df     = daysFrom(r.due_date)
              const ds     = displayStatus(r)
              const isDone = r.status === 'completado'
              return (
                <div key={r.id}
                  onClick={() => !isDone && openEdit(r)}
                  className={`card-sm flex items-start gap-4 transition-all ${
                    isDone ? 'opacity-40' :
                    ds === 'vencido' ? 'border-red-500/20 bg-red-500/5 cursor-pointer hover:bg-red-500/10' :
                    df.urgent ? 'border-amber-500/15 cursor-pointer hover:bg-gray-800/60' :
                    'cursor-pointer hover:bg-gray-800/60'
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isDone ? 'bg-gray-800' : ds === 'vencido' ? 'bg-red-500/10' : 'bg-gray-800'
                  }`}>
                    <Icon size={14} className={isDone ? 'text-gray-600' : ds === 'vencido' ? 'text-red-400' : tc.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium ${isDone ? 'line-through' : ''}`}
                         style={{ color: isDone ? 'var(--text-3)' : 'var(--text-1)' }}>{r.title}</p>
                      <Badge variant={tc.badge}>{tc.label}</Badge>
                    </div>
                    {r.description && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{r.description}</p>
                    )}
                    {r.related_to && (
                      <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text-3)' }}>→ {r.related_to}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <div className="text-right">
                      <p className={`text-xs font-mono font-medium ${
                        ds === 'vencido' ? 'text-red-400' : df.urgent ? 'text-amber-400' : ''
                      }`} style={!df.urgent && ds !== 'vencido' ? { color: 'var(--text-3)' } : {}}>
                        {r.due_date}
                      </p>
                      <p className={`text-[10px] ${
                        ds === 'vencido' ? 'text-red-400' : df.urgent ? 'text-amber-400' : 'text-gray-600'
                      }`}>{df.label}</p>
                    </div>
                    {!isDone && (
                      <button onClick={() => complete(r.id!)}
                        className="p-1.5 rounded-md text-gray-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                        <CheckCircle size={14} />
                      </button>
                    )}
                    <button onClick={() => remove(r.id!)}
                      className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}

type Tab = 'semana' | 'recordatorios'

export default function AgendaPage() {
  const [tab, setTab] = useState<Tab>('semana')

  return (
    <div className="space-y-5 max-w-5xl">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Agenda</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Semana operativa y recordatorios</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--surface-2)' }}>
        {([
          { id: 'semana',        label: 'Semana',        icon: CalendarDays },
          { id: 'recordatorios', label: 'Recordatorios', icon: Bell         },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'semana'        && <SemanaView />}
      {tab === 'recordatorios' && <RecordatoriosView />}
    </div>
  )
}

