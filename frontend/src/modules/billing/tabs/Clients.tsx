import { useState, useEffect } from 'react'
import {
  Plus, Search, User, Building2, Phone, Mail,
  Repeat2, CheckCircle, Clock, AlertCircle, Loader2, Trash2, X,
} from 'lucide-react'
import Badge from '@/components/Badge'
import Pagination from '@/components/Pagination'
import { ClientsService, type Client } from '@/lib/services/clients.service'

type PayStatus = 'paid' | 'pending' | 'overdue'

interface TxRecord {
  id: number
  client: string
  amount: number
  date: string
  plan: string
}

interface SaasClientLocal extends Client {
  sessionStatus: PayStatus
  sessionLastPaid: string
}

const PER_PAGE = 5

const statusIcon: Record<PayStatus, React.ElementType> = {
  paid: CheckCircle, pending: Clock, overdue: AlertCircle,
}
const statusVariant: Record<PayStatus, 'green' | 'amber' | 'red'> = {
  paid: 'green', pending: 'amber', overdue: 'red',
}
const statusLabel: Record<PayStatus, string> = {
  paid: 'Pagado', pending: 'Pendiente', overdue: 'Vencido',
}

interface NewClientForm {
  name: string
  email: string
  phone: string
  company: string
  type: Client['type']
  plan: string
  monthly_fee: string
  billing_day: string
  notes: string
}

const DEFAULT_FORM: NewClientForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  type: 'freelance',
  plan: '',
  monthly_fee: '',
  billing_day: '',
  notes: '',
}

function deriveStatus(client: Client): PayStatus {
  if (!client.billing_day) return 'pending'
  const today = new Date()
  const dueDay = client.billing_day
  const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (dueDate <= today) return 'pending'
  return 'overdue'
}

export default function Clients() {
  const [clients, setClients]     = useState<Client[]>([])
  const [saasLocal, setSaasLocal] = useState<SaasClientLocal[]>([])
  const [loading, setLoading]     = useState(true)

  const [txHistory, setTxHistory] = useState<TxRecord[]>([])
  const [toast, setToast]         = useState<string | null>(null)

  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')

  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState<NewClientForm>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    ClientsService.list()
      .then((data) => {
        setClients(data)
        const saas = data
          .filter(c => c.type === 'saas' && (c.monthly_fee ?? 0) > 0)
          .map<SaasClientLocal>(c => ({
            ...c,
            sessionStatus: deriveStatus(c),
            sessionLastPaid: '',
          }))
        setSaasLocal(saas)
      })
      .finally(() => setLoading(false))
  }, [])

  const notify = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const handleCharge = (client: SaasClientLocal) => {
    if (client.sessionStatus === 'paid') return
    const today = new Date().toISOString().slice(0, 10)

    setSaasLocal(prev =>
      prev.map(c =>
        c.id === client.id
          ? { ...c, sessionStatus: 'paid', sessionLastPaid: today }
          : c
      )
    )

    ClientsService.update(client.id, { ...client }).catch(() => {
      setSaasLocal(prev =>
        prev.map(c =>
          c.id === client.id
            ? { ...c, sessionStatus: client.sessionStatus, sessionLastPaid: client.sessionLastPaid }
            : c
        )
      )
    })

    setTxHistory(prev => [{
      id: Date.now(),
      client: client.name,
      amount: client.monthly_fee ?? 0,
      date: today,
      plan: client.plan ?? '—',
    }, ...prev])

    notify(`✓ RD$ ${(client.monthly_fee ?? 0).toLocaleString()} cobrado a ${client.name} — registrado en balance`)
  }

  const handleRemove = (id: number) => {
    setClients(prev => prev.filter(c => c.id !== id))
    setSaasLocal(prev => prev.filter(c => c.id !== id))
    ClientsService.remove(id).catch(() => {
      ClientsService.list().then(data => {
        setClients(data)
        const saas = data
          .filter(c => c.type === 'saas' && (c.monthly_fee ?? 0) > 0)
          .map<SaasClientLocal>(c => ({
            ...c,
            sessionStatus: deriveStatus(c),
            sessionLastPaid: '',
          }))
        setSaasLocal(saas)
      })
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload: Partial<Client> = {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        company: form.company || undefined,
        type: form.type,
        plan: form.plan || undefined,
        monthly_fee: form.monthly_fee ? Number(form.monthly_fee) : undefined,
        billing_day: form.billing_day ? Number(form.billing_day) : undefined,
        notes: form.notes || undefined,
      }
      const created = await ClientsService.create(payload)
      setClients(prev => [created, ...prev])
      if (created.type === 'saas' && (created.monthly_fee ?? 0) > 0) {
        setSaasLocal(prev => [{
          ...created,
          sessionStatus: deriveStatus(created),
          sessionLastPaid: '',
        }, ...prev])
      }
      setForm(DEFAULT_FORM)
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const totalMRR  = saasLocal.reduce((a, c) => a + (c.monthly_fee ?? 0), 0)
  const collected = saasLocal.filter(c => c.sessionStatus === 'paid').reduce((a, c) => a + (c.monthly_fee ?? 0), 0)
  const pending   = saasLocal.filter(c => c.sessionStatus !== 'paid').reduce((a, c) => a + (c.monthly_fee ?? 0), 0)

  const filtered  = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const progressPct = totalMRR > 0 ? Math.round((collected / totalMRR) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm border border-emerald-500/20 bg-gray-900 text-emerald-300">
          {toast}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Repeat2 size={15} className="text-emerald-400" />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
            Cobros SaaS — {new Date().toLocaleString('es-DO', { month: 'long', year: 'numeric' })}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="card py-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>MRR total</p>
            <p className="text-lg font-bold text-emerald-400">RD$ {totalMRR.toLocaleString()}</p>
          </div>
          <div className="card py-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Cobrado</p>
            <p className="text-lg font-bold text-emerald-400">RD$ {collected.toLocaleString()}</p>
          </div>
          <div className="card py-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Por cobrar</p>
            <p className={`text-lg font-bold ${pending > 0 ? 'text-amber-400' : 'text-gray-500'}`}>
              RD$ {pending.toLocaleString()}
            </p>
          </div>
        </div>

        {totalMRR > 0 && (
          <div>
            <div className="flex justify-between mb-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
              <span>Progreso de cobros del mes</span>
              <span className="font-mono text-emerald-400">{progressPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-800">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          {saasLocal.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Repeat2 size={28} className="text-gray-600" />
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No hay clientes SaaS activos.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header w-10"></th>
                  <th className="table-header">Cliente</th>
                  <th className="table-header">Plan</th>
                  <th className="table-header text-right">Monto</th>
                  <th className="table-header">Vence día</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {saasLocal.map(c => {
                  const Icon = statusIcon[c.sessionStatus]
                  return (
                    <tr key={c.id} className="table-row">
                      <td className="table-cell">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          c.sessionStatus === 'paid'    ? 'bg-emerald-500/10' :
                          c.sessionStatus === 'overdue' ? 'bg-red-500/10' : 'bg-amber-500/10'
                        }`}>
                          <Icon size={14} className={
                            c.sessionStatus === 'paid'    ? 'text-emerald-400' :
                            c.sessionStatus === 'overdue' ? 'text-red-400' : 'text-amber-400'
                          } />
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{c.name}</p>
                        {c.company && (
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{c.company}</p>
                        )}
                      </td>
                      <td className="table-cell">
                        <Badge variant="blue">{c.plan ?? '—'}</Badge>
                      </td>
                      <td className="table-cell text-right font-mono text-sm font-semibold text-emerald-400">
                        RD$ {(c.monthly_fee ?? 0).toLocaleString()}
                      </td>
                      <td className="table-cell text-sm" style={{ color: 'var(--text-3)' }}>
                        {c.billing_day ? `día ${c.billing_day}` : '—'}
                      </td>
                      <td className="table-cell">
                        <Badge variant={statusVariant[c.sessionStatus]}>{statusLabel[c.sessionStatus]}</Badge>
                      </td>
                      <td className="table-cell text-right">
                        {c.sessionStatus !== 'paid' ? (
                          <button
                            onClick={() => handleCharge(c)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                          >
                            Cobrar
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-500 font-medium">✓ Al día</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {txHistory.length > 0 && (
          <div className="card space-y-3">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Cobros registrados esta sesión</p>
            <div className="space-y-2">
              {txHistory.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>{tx.client}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{tx.plan} · {tx.date}</p>
                  </div>
                  <span className="text-sm font-mono font-semibold text-emerald-400">+RD$ {tx.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Total cobrado</span>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  +RD$ {txHistory.reduce((a, t) => a + t.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Todos los clientes</h3>

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
            <input
              className="input pl-9 py-1.5 text-xs"
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <button className="btn-primary text-xs py-1.5" onClick={() => setShowForm(v => !v)}>
            <Plus size={13} /> Nuevo Cliente
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Nuevo Cliente</h3>
                <button onClick={() => { setShowForm(false); setForm(DEFAULT_FORM) }} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nombre *</label>
                    <input className="input" placeholder="Nombre completo o empresa" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">Tipo *</label>
                    <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as Client['type'] }))}>
                      <option value="freelance">Freelance</option>
                      <option value="saas">SaaS</option>
                      <option value="project">Proyecto</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" className="input" placeholder="cliente@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Teléfono</label>
                    <input className="input" placeholder="+1 809-555-0100" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Empresa</label>
                    <input className="input" placeholder="Nombre de la empresa" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Notas</label>
                    <input className="input" placeholder="Opcional..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                  {form.type === 'saas' && (
                    <>
                      <div>
                        <label className="label">Plan</label>
                        <input className="input" placeholder="Suites Pro" value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Cuota mensual (RD$)</label>
                        <input type="number" className="input" placeholder="8500" min={0} value={form.monthly_fee} onChange={e => setForm(p => ({ ...p, monthly_fee: e.target.value }))} />
                      </div>
                      <div className="col-span-2">
                        <label className="label">Día de cobro (1-31)</label>
                        <input type="number" className="input" placeholder="1" min={1} max={31} value={form.billing_day} onChange={e => setForm(p => ({ ...p, billing_day: e.target.value }))} />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setShowForm(false); setForm(DEFAULT_FORM) }} className="btn-secondary flex-1">Cancelar</button>
                  <button type="submit" className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2" disabled={submitting}>
                    {submitting && <Loader2 size={13} className="animate-spin" />}
                    {submitting ? 'Guardando…' : 'Agregar cliente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <User size={28} className="text-gray-600" />
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                {search ? 'Sin resultados para la búsqueda.' : 'No hay clientes. Agrega el primero.'}
              </p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header w-10"></th>
                    <th className="table-header">Cliente</th>
                    <th className="table-header">Contacto</th>
                    <th className="table-header">Tipo</th>
                    <th className="table-header">Plan / Cuota</th>
                    <th className="table-header"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c) => (
                    <tr key={c.id} className="table-row">
                      <td className="table-cell">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          c.type === 'saas' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
                        }`}>
                          {c.company
                            ? <Building2 size={14} className={c.type === 'saas' ? 'text-emerald-400' : 'text-blue-400'} />
                            : <User size={14} className={c.type === 'saas' ? 'text-emerald-400' : 'text-blue-400'} />
                          }
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{c.name}</p>
                        {c.company && (
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{c.company}</p>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="space-y-1">
                          {c.email && (
                            <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
                              <Mail size={11} /> {c.email}
                            </p>
                          )}
                          {c.phone && (
                            <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                              <Phone size={11} /> {c.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <Badge variant={
                          c.type === 'saas'      ? 'green' :
                          c.type === 'freelance' ? 'blue'  : 'amber'
                        }>
                          {c.type === 'saas' ? 'SaaS' : c.type === 'freelance' ? 'Freelance' : 'Proyecto'}
                        </Badge>
                      </td>
                      <td className="table-cell">
                        {c.plan ? (
                          <div>
                            <p className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{c.plan}</p>
                            {c.monthly_fee && (
                              <p className="text-[10px] font-mono text-emerald-400">RD$ {c.monthly_fee.toLocaleString()}/mes</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-3)' }}>—</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1 justify-end">
                          <button
                            className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Eliminar cliente"
                            onClick={() => handleRemove(c.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
