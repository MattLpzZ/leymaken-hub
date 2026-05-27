import { useEffect, useState } from 'react'
import { FileText, DollarSign, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import bizApi from '@/lib/bizApi'
import { useBizAuthStore } from '@/stores/bizAuthStore'
import { BizConnectPrompt } from '@/components/BizConnectPrompt'

interface Client { id: number; name: string }
interface Invoice {
  id: number
  number: string
  client: Client
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  paid_at: string | null
  total: string
  currency: string
}

type StatusFilter = 'all' | 'pending' | 'paid' | 'overdue'

const STATUS_BADGE: Record<string, string> = {
  pending:   'badge-yellow',
  paid:      'badge-green',
  overdue:   'badge-red',
  cancelled: 'badge-gray',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagada', overdue: 'Vencida', cancelled: 'Cancelada',
}

function fmt(amount: string, currency = 'DOP') {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount))
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function BillingPage() {
  const { token } = useBizAuthStore()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(false)
  const [marking, setMarking] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    bizApi.get('/invoices').then(r => setInvoices(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { if (token) load() }, [token])

  if (!token) return <BizConnectPrompt />

  const visible = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)

  const pendingTotal  = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.total), 0)
  const overdueTotal  = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.total), 0)
  const paidThisMonth = invoices.filter(i => {
    if (i.status !== 'paid' || !i.paid_at) return false
    const d = new Date(i.paid_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s, i) => s + Number(i.total), 0)

  const markPaid = async (id: number) => {
    setMarking(id)
    try {
      await bizApi.patch(`/invoices/${id}/mark-paid`)
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'paid', paid_at: new Date().toISOString() } : i))
    } finally {
      setMarking(null)
    }
  }

  const TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all',     label: 'Todas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'overdue', label: 'Vencidas' },
    { key: 'paid',    label: 'Pagadas' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Facturación</h1>
        <button className="btn-secondary text-xs flex items-center gap-1" onClick={load} disabled={loading}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Pendiente',         value: fmt(String(pendingTotal)), icon: FileText,    color: '#f59e0b' },
          { label: 'Vencido',           value: fmt(String(overdueTotal)), icon: AlertCircle, color: '#ef4444' },
          { label: 'Cobrado este mes',  value: fmt(String(paidThisMonth)), icon: CheckCircle, color: '#10b981' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="card space-y-4">
        <div className="flex gap-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="text-xs px-3 py-1.5 rounded font-medium"
              style={{
                background: filter === key ? 'var(--accent, #10b981)' : 'var(--surface-2)',
                color: filter === key ? '#fff' : 'var(--text-3)',
              }}
            >
              {label}
              {key !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  {invoices.filter(i => i.status === key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Invoice list */}
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {visible.map(inv => (
            <div key={inv.id} className="flex items-center gap-3 py-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium" style={{ color: 'var(--text-1)' }}>{inv.number}</span>
                  <span className={`badge ${STATUS_BADGE[inv.status] ?? 'badge-gray'}`}>{STATUS_LABEL[inv.status] ?? inv.status}</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {inv.client.name} · Emitida {fmtDate(inv.issue_date)} · Vence {fmtDate(inv.due_date)}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                  {fmt(inv.total, inv.currency)}
                </span>
                {inv.status === 'pending' && (
                  <button
                    className="btn-secondary text-xs"
                    onClick={() => markPaid(inv.id)}
                    disabled={marking === inv.id}
                  >
                    {marking === inv.id ? '...' : 'Marcar pagada'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {!visible.length && (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--text-3)' }}>Sin facturas</p>
          )}
        </div>
      </div>
    </div>
  )
}
