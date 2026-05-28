import { useState, useEffect } from 'react'
import { Plus, CheckCircle, AlertCircle, Clock, XCircle, Loader2, X } from 'lucide-react'
import Badge from '@/components/Badge'
import StatCard from '@/components/StatCard'
import { DollarSign, Users, TrendingUp } from 'lucide-react'
import { ClientsService, type Client } from '@/lib/services/clients.service'

type SubStatus = 'active' | 'overdue' | 'paused' | 'cancelled'

const statusMap: Record<SubStatus, { label: string; color: 'green'|'red'|'amber'|'gray'; icon: React.ElementType }> = {
  active:    { label: 'Activo',    color: 'green', icon: CheckCircle },
  overdue:   { label: 'Vencido',   color: 'red',   icon: AlertCircle },
  paused:    { label: 'Pausado',   color: 'amber', icon: Clock },
  cancelled: { label: 'Cancelado', color: 'gray',  icon: XCircle },
}

function deriveStatus(client: Client): SubStatus {
  if (!client.billing_day) return 'active'
  const today = new Date()
  const due = new Date(today.getFullYear(), today.getMonth(), client.billing_day)
  if (due < today) return 'overdue'
  return 'active'
}

function nextBillingDate(billingDay: number | undefined): string {
  if (!billingDay) return '—'
  const today = new Date()
  let d = new Date(today.getFullYear(), today.getMonth(), billingDay)
  if (d <= today) d = new Date(today.getFullYear(), today.getMonth() + 1, billingDay)
  return d.toISOString().slice(0, 10)
}

const BLANK = {
  name: '', email: '', phone: '', company: '',
  plan: '', monthly_fee: '', billing_day: '',
}

export default function Subscriptions() {
  const [clients, setClients]   = useState<Client[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(BLANK)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    ClientsService.list()
      .then(all => setClients(all.filter(c => c.type === 'saas')))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const active  = clients.filter(c => deriveStatus(c) === 'active')
  const overdue = clients.filter(c => deriveStatus(c) === 'overdue')
  const mrr     = clients.reduce((a, c) => a + (c.monthly_fee ?? 0), 0)
  const arr     = mrr * 12

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await ClientsService.create({
        name:        form.name,
        email:       form.email || undefined,
        phone:       form.phone || undefined,
        company:     form.company || undefined,
        type:        'saas',
        plan:        form.plan || undefined,
        monthly_fee: form.monthly_fee ? Number(form.monthly_fee) : undefined,
        billing_day: form.billing_day ? Number(form.billing_day) : undefined,
      })
      setClients(prev => [created, ...prev])
      setForm(BLANK)
      setShowForm(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar esta suscripción?')) return
    setClients(prev => prev.filter(c => c.id !== id))
    ClientsService.remove(id).catch(() =>
      ClientsService.list().then(all => setClients(all.filter(c => c.type === 'saas')))
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-emerald-400" />
    </div>
  )

  return (
    <div className="space-y-5">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Clientes activos" value={active.length}                              icon={Users}       color="bg-emerald-600" />
        <StatCard title="Vencidos"          value={overdue.length}                            icon={AlertCircle} color="bg-red-600" />
        <StatCard title="MRR"               value={`RD$ ${Math.round(mrr).toLocaleString()}`} icon={DollarSign}  color="bg-blue-600" />
        <StatCard title="ARR"               value={`RD$ ${Math.round(arr).toLocaleString()}`} icon={TrendingUp}  color="bg-purple-600" />
      </div>

      {overdue.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            <span className="text-red-400 font-semibold">{overdue.length} suscripción{overdue.length > 1 ? 'es' : ''}</span>{' '}
            vencida{overdue.length > 1 ? 's' : ''} — {overdue.map(c => c.name).join(', ')}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{clients.length} suscripciones activas</p>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs py-1.5">
          <Plus size={13} /> Nueva Suscripción
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Users size={28} className="text-gray-600" />
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin suscripciones registradas</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-10"></th>
                <th className="table-header">Cliente</th>
                <th className="table-header">Plan</th>
                <th className="table-header">Ciclo</th>
                <th className="table-header text-right">Monto</th>
                <th className="table-header text-right">MRR equiv.</th>
                <th className="table-header">Próximo cobro</th>
                <th className="table-header">Estado</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => {
                const status = deriveStatus(c)
                const st   = statusMap[status]
                const Icon = st.icon
                const mrrEq = c.monthly_fee ?? 0
                return (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        status === 'active'  ? 'bg-emerald-500/10' :
                        status === 'overdue' ? 'bg-red-500/10' :
                        status === 'paused'  ? 'bg-amber-500/10' : 'bg-gray-500/10'
                      }`}>
                        <Icon size={14} className={
                          status === 'active'  ? 'text-emerald-400' :
                          status === 'overdue' ? 'text-red-400' :
                          status === 'paused'  ? 'text-amber-400' : 'text-gray-500'
                        } />
                      </div>
                    </td>
                    <td className="table-cell">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{c.name}</p>
                      {c.company && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{c.company}</p>}
                    </td>
                    <td className="table-cell">
                      <p className="text-sm" style={{ color: 'var(--text-2)' }}>{c.plan || '—'}</p>
                    </td>
                    <td className="table-cell text-xs" style={{ color: 'var(--text-3)' }}>Mensual</td>
                    <td className="table-cell text-right font-mono text-sm font-semibold text-emerald-400">
                      RD$ {mrrEq.toLocaleString()}
                    </td>
                    <td className="table-cell text-right font-mono text-xs" style={{ color: 'var(--text-3)' }}>
                      RD$ {mrrEq.toLocaleString()}
                    </td>
                    <td className="table-cell">
                      <p className={`text-xs font-mono ${status === 'overdue' ? 'text-red-400' : ''}`}
                         style={status !== 'overdue' ? { color: 'var(--text-2)' } : {}}>
                        {nextBillingDate(c.billing_day)}
                      </p>
                      {c.billing_day && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>día {c.billing_day} de cada mes</p>}
                    </td>
                    <td className="table-cell">
                      <Badge variant={st.color}>{st.label}</Badge>
                    </td>
                    <td className="table-cell">
                      <button onClick={() => remove(c.id)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <XCircle size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Nueva Suscripción</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Nombre del cliente</label>
                <input required className="input" placeholder="Empresa o persona..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Plan</label>
                  <input className="input" placeholder="Suites Pro..." value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Cuota mensual (RD$)</label>
                  <input required type="number" min="0" className="input" placeholder="0.00" value={form.monthly_fee} onChange={e => setForm(f => ({ ...f, monthly_fee: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Día de cobro (1-31)</label>
                  <input type="number" min="1" max="31" className="input" placeholder="1" value={form.billing_day} onChange={e => setForm(f => ({ ...f, billing_day: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Empresa</label>
                  <input className="input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving ? 'Guardando…' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
