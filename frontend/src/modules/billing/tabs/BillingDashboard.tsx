import { useState, useEffect } from 'react'
import { CheckCircle, Clock, AlertCircle, TrendingUp, ClipboardCheck, CalendarDays, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Badge from '@/components/Badge'
import { InvoicesService, type Invoice } from '@/lib/services/invoices.service'
import { QuotesService, type Quote } from '@/lib/services/quotes.service'

const MONTH_NAMES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const statusVariant: Record<string, 'green'|'amber'|'red'|'blue'|'gray'> = {
  paid: 'green', pending: 'amber', partial: 'blue', overdue: 'red', cancelled: 'gray',
}
const statusLabel: Record<string, string> = {
  paid: 'Pagada', pending: 'Pendiente', partial: 'Parcial', overdue: 'Vencida', cancelled: 'Cancelada',
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-xs space-y-1 shadow-xl">
      <p className="font-semibold text-gray-300 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'cobrado' ? 'Cobrado' : 'Pendiente'}: RD$ {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function BillingDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [quotes, setQuotes]     = useState<Quote[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([InvoicesService.list(), QuotesService.list()])
      .then(([inv, qt]) => { setInvoices(inv); setQuotes(qt) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  const totalBilled  = invoices.reduce((a, i) => a + Number(i.total), 0)
  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + Number(i.total), 0)
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((a, i) => a + Number(i.total), 0)
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((a, i) => a + Number(i.total), 0)
  const conversionRate = quotes.length > 0
    ? Math.round(quotes.filter(q => q.converted_invoice_id).length / quotes.length * 100)
    : 0

  const now = new Date()
  const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const cobrado   = invoices.filter(inv => inv.status === 'paid' && (inv.paid_at ?? inv.issue_date)?.toString().startsWith(key)).reduce((a, inv) => a + Number(inv.total), 0)
    const pendiente = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled' && inv.issue_date?.toString().startsWith(key)).reduce((a, inv) => a + Number(inv.total), 0)
    return { month: MONTH_NAMES[d.getMonth() + 1], cobrado, pendiente }
  })

  const quoteFunnel = [
    { label: 'Enviadas',   value: quotes.length,                                    color: 'bg-blue-500' },
    { label: 'Aprobadas',  value: quotes.filter(q => q.status === 'approved').length, color: 'bg-emerald-500' },
    { label: 'Facturadas', value: quotes.filter(q => q.converted_invoice_id).length,  color: 'bg-purple-500' },
    { label: 'Rechazadas', value: quotes.filter(q => q.status === 'rejected').length,  color: 'bg-red-500' },
  ]

  const byService: Record<string, number> = {}
  invoices.forEach(inv => {
    (inv.items ?? []).forEach((it: any) => {
      byService[it.description] = (byService[it.description] ?? 0) + Number(it.unit_price) * Number(it.qty)
    })
  })
  const topServices = Object.entries(byService)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, amount]) => ({ name: name.length > 28 ? name.slice(0, 26) + '…' : name, amount }))

  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const MONTH = `${MONTH_NAMES[now.getMonth() + 1]} ${now.getFullYear()}`

  const collectedThisMonth = invoices
    .filter(i => i.status === 'paid' && (i.paid_at ?? i.issue_date)?.toString().startsWith(monthKey))
    .reduce((a, i) => a + Number(i.total), 0)

  const pendingThisMonth = invoices
    .filter(i => i.status === 'pending' && i.due_date?.toString().startsWith(monthKey))
    .map(i => ({ label: i.client?.name ?? '—', sub: (i.items?.[0] as any)?.description ?? '', amount: Number(i.total) }))

  const overdueItems = invoices
    .filter(i => i.status === 'overdue')
    .map(i => ({ label: i.client?.name ?? '—', sub: (i.items?.[0] as any)?.description ?? '', amount: Number(i.total) }))

  const quotePipeline = quotes
    .filter(q => q.status === 'approved' && !q.converted_invoice_id)
    .map(q => ({ label: q.client?.name ?? '—', amount: Number(q.total) }))

  const projectedBase = collectedThisMonth + pendingThisMonth.reduce((a, i) => a + i.amount, 0)
  const projectedFull = projectedBase + overdueItems.reduce((a, i) => a + i.amount, 0) + quotePipeline.reduce((a, i) => a + i.amount, 0)
  const progressPct = projectedBase > 0 ? Math.min(Math.round(collectedThisMonth / projectedBase * 100), 100) : 0

  const urgent = invoices
    .filter(i => ['pending', 'overdue'].includes(i.status))
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
    .slice(0, 5)

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>Cobrado</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600/15 flex items-center justify-center">
              <CheckCircle size={15} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400">RD$ {totalPaid.toLocaleString()}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            {totalBilled > 0 ? Math.round(totalPaid / totalBilled * 100) : 0}% del total facturado
          </p>
        </div>
        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>Por cobrar</span>
            <div className="w-8 h-8 rounded-lg bg-amber-600/15 flex items-center justify-center">
              <Clock size={15} className="text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400">RD$ {totalPending.toLocaleString()}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            {invoices.filter(i => i.status === 'pending').length} facturas abiertas
          </p>
        </div>
        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>Vencido</span>
            <div className="w-8 h-8 rounded-lg bg-red-600/15 flex items-center justify-center">
              <AlertCircle size={15} className="text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-400">RD$ {totalOverdue.toLocaleString()}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            {invoices.filter(i => i.status === 'overdue').length} factura(s) vencida(s)
          </p>
        </div>
        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>Conversión</span>
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 flex items-center justify-center">
              <TrendingUp size={15} className="text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{conversionRate}%</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>cotizaciones → facturas</p>
        </div>
      </div>

      <div className="card space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-emerald-400" />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                Ingresos proyectados — {MONTH}
              </p>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              Confirmados + esperados + pipeline de cotizaciones
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-400">RD$ {projectedBase.toLocaleString()}</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              escenario base · hasta <span className="text-purple-400">RD$ {projectedFull.toLocaleString()}</span> con pipeline
            </p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>Progreso del mes</span>
            <span className="text-xs font-mono font-semibold text-emerald-400">{progressPct}% cobrado</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-gray-800 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px]" style={{ color: 'var(--text-3)' }}>
            <span>RD$ {collectedThisMonth.toLocaleString()} cobrado</span>
            <span>meta RD$ {projectedBase.toLocaleString()}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={13} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">Confirmados</span>
              <span className="ml-auto text-xs font-mono font-bold text-emerald-400">RD$ {collectedThisMonth.toLocaleString()}</span>
            </div>
            {collectedThisMonth === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin cobros confirmados este mes</p>
            ) : (
              <div className="space-y-2">
                {invoices.filter(i => i.status === 'paid' && (i.paid_at ?? i.issue_date)?.toString().startsWith(monthKey)).slice(0,3).map(i => (
                  <div key={i.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-1)' }}>{i.client?.name ?? '—'}</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>{(i.items?.[0] as any)?.description ?? ''}</p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 flex-shrink-0">RD$ {Number(i.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">Esperados</span>
              <span className="ml-auto text-xs font-mono font-bold text-amber-400">
                RD$ {(pendingThisMonth.reduce((a,i)=>a+i.amount,0) + overdueItems.reduce((a,i)=>a+i.amount,0)).toLocaleString()}
              </span>
            </div>
            {pendingThisMonth.length === 0 && overdueItems.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin facturas pendientes</p>
            ) : (
              <div className="space-y-2">
                {pendingThisMonth.slice(0,3).map((p, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-1)' }}>{p.label}</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>{p.sub}</p>
                    </div>
                    <span className="text-xs font-mono text-amber-400 flex-shrink-0">RD$ {p.amount.toLocaleString()}</span>
                  </div>
                ))}
                {overdueItems.slice(0,2).map((o, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <AlertCircle size={9} className="text-red-400 flex-shrink-0" />
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-1)' }}>{o.label}</p>
                      </div>
                      <p className="text-[10px] truncate text-red-400/70">{o.sub} — vencida</p>
                    </div>
                    <span className="text-xs font-mono text-red-400 flex-shrink-0">RD$ {o.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl bg-purple-500/5 border border-purple-500/15 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={13} className="text-purple-400" />
              <span className="text-xs font-semibold text-purple-400">Pipeline</span>
              <span className="ml-auto text-xs font-mono font-bold text-purple-400">
                RD$ {quotePipeline.reduce((a,i)=>a+i.amount,0).toLocaleString()}
              </span>
            </div>
            {quotePipeline.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin cotizaciones aprobadas pendientes</p>
            ) : (
              <div className="space-y-2">
                {quotePipeline.slice(0,4).map((q, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-1)' }}>{q.label}</p>
                    <span className="text-xs font-mono text-purple-400 flex-shrink-0">RD$ {q.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] pt-1 border-t border-purple-500/10" style={{ color: 'var(--text-3)' }}>
              Pendientes de convertir a factura
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2 space-y-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Ingresos por mes</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Cobrado vs. pendiente</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueByMonth} barGap={4} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false}
                tickFormatter={v => v === 0 ? '0' : `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="cobrado"   fill="#34d399" radius={[4,4,0,0]} />
              <Bar dataKey="pendiente" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Cobrado</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Pendiente</span>
          </div>
        </div>
        <div className="card space-y-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Embudo de cotizaciones</p>
          <div className="space-y-3">
            {quoteFunnel.map((q) => (
              <div key={q.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--text-2)' }}>{q.label}</span>
                  <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-1)' }}>{q.value}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-800">
                  <div className={`h-1.5 rounded-full ${q.color}`}
                    style={{ width: `${quotes.length > 0 ? Math.round(q.value / quotes.length * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-gray-800">
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Valor aprobado:
              <span className="text-emerald-400 font-semibold ml-1">
                RD$ {quotes.filter(q=>q.status==='approved').reduce((a,q)=>a+Number(q.total),0).toLocaleString()}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card space-y-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Servicios más facturados</p>
          {topServices.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin datos de facturación aún</p>
          ) : (
            <div className="space-y-3">
              {topServices.map((s) => {
                const pct = totalBilled > 0 ? Math.round(s.amount / totalBilled * 100) : 0
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs truncate max-w-[200px]" style={{ color: 'var(--text-2)' }}>{s.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-mono text-emerald-400">RD$ {s.amount.toLocaleString()}</span>
                        <span className="text-[10px] w-7 text-right" style={{ color: 'var(--text-3)' }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1 rounded-full bg-gray-800">
                      <div className="h-1 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="card space-y-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Facturas urgentes</p>
          {urgent.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Todo al día ✓</p>
          ) : (
            <div className="space-y-2">
              {urgent.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-1)' }}>{inv.client?.name ?? '—'}</p>
                      <Badge variant={statusVariant[inv.status]}>{statusLabel[inv.status]}</Badge>
                    </div>
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{(inv.items?.[0] as any)?.description ?? ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-mono font-semibold text-emerald-400">RD$ {Number(inv.total).toLocaleString()}</p>
                    <p className={`text-[10px] mt-0.5 ${inv.status === 'overdue' ? 'text-red-400' : 'text-amber-400'}`}>
                      vence {inv.due_date?.toString().slice(0, 10)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
