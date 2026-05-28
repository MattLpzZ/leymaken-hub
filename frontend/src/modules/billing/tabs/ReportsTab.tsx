import { useState, useEffect } from 'react'
import { Download, Loader2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts'
import { InvoicesService, type Invoice } from '@/lib/services/invoices.service'
import { TransactionsService } from '@/lib/services/transactions.service'

const MONTH_NAMES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const PIE_COLORS  = ['#34d399', '#f59e0b', '#60a5fa', '#f87171', '#a78bfa']

const statusColor: Record<string, string> = {
  paid: 'text-emerald-400', pending: 'text-amber-400',
  partial: 'text-blue-400', overdue: 'text-red-400', cancelled: 'text-gray-500',
}
const statusLabelMap: Record<string, string> = {
  paid: 'Pagado', pending: 'Pendiente', partial: 'Parcial', overdue: 'Vencido', cancelled: 'Cancelado',
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-xs space-y-1 shadow-xl">
      {label && <p className="font-semibold text-gray-300 mb-1">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? p.fill }}>
          {p.name}: {typeof p.value === 'number' && p.value > 100
            ? `RD$ ${Number(p.value).toLocaleString()}`
            : p.value}
        </p>
      ))}
    </div>
  )
}

export default function ReportsTab() {
  const [invoices,   setInvoices]   = useState<Invoice[]>([])
  const [monthly,    setMonthly]    = useState<{ month: number; income: number; expense: number }[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      InvoicesService.list(),
      TransactionsService.monthlySummary(new Date().getFullYear()),
    ])
      .then(([inv, sum]) => { setInvoices(inv); setMonthly(sum) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 size={24} className="animate-spin text-emerald-400" /></div>

  const now = new Date()
  const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i))
    const m = monthly.find(s => s.month === d.getMonth() + 1)
    return {
      month: `${MONTH_NAMES[d.getMonth() + 1]} ${String(d.getFullYear()).slice(2)}`,
      ingresos: m?.income ?? 0,
      gastos:   m?.expense ?? 0,
    }
  })

  const totalRevenue  = monthly.reduce((a, m) => a + m.income, 0)
  const totalExpenses = monthly.reduce((a, m) => a + m.expense, 0)
  const netProfit     = totalRevenue - totalExpenses
  const avgTicket     = invoices.length > 0 ? Math.round(totalRevenue / invoices.length) : 0

  const statusCounts: Record<string, number> = {}
  invoices.forEach(inv => { statusCounts[inv.status] = (statusCounts[inv.status] ?? 0) + 1 })
  const invoiceStatus = Object.entries(statusCounts).map(([name, value], i) => ({
    name: statusLabelMap[name] ?? name,
    value,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }))

  const byCategory: Record<string, number> = {}
  invoices.forEach(inv => {
    (inv.items ?? []).forEach((item: any) => {
      const cat = item.description?.split(' ')[0] ?? 'Otro'
      byCategory[cat] = (byCategory[cat] ?? 0) + Number(item.unit_price) * Number(item.qty)
    })
  })
  const revenueByCategory = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  const byClient: Record<string, { total: number; count: number; status: string }> = {}
  invoices.forEach(inv => {
    const name = inv.client?.name ?? `Cliente ${inv.client_id}`
    if (!byClient[name]) byClient[name] = { total: 0, count: 0, status: inv.status }
    byClient[name].total += Number(inv.total)
    byClient[name].count += 1
  })
  const topClients = Object.entries(byClient)
    .sort((a, b) => b[1].total - a[1].total).slice(0, 5)
    .map(([client, d]) => ({ client, ...d }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Reporte de facturación</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Año {now.getFullYear()} · datos en tiempo real</p>
        </div>
        <button className="btn-secondary text-xs py-1.5">
          <Download size={13} /> Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ingresos totales',  value: `RD$ ${totalRevenue.toLocaleString()}`,  color: 'text-emerald-400' },
          { label: 'Gastos operativos', value: `RD$ ${totalExpenses.toLocaleString()}`, color: 'text-red-400'     },
          { label: 'Utilidad neta',     value: `RD$ ${netProfit.toLocaleString()}`,      color: netProfit >= 0 ? 'text-blue-400' : 'text-red-400' },
          { label: 'Ticket promedio',   value: `RD$ ${avgTicket.toLocaleString()}`,      color: 'var(--text-1)'    },
        ].map(k => (
          <div key={k.label} className="card space-y-1">
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2 space-y-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Ingresos vs. Gastos</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false}
                tickFormatter={v => v === 0 ? '0' : `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: '#34d399' }} />
              <Line type="monotone" dataKey="gastos"   name="Gastos"   stroke="#f87171" strokeWidth={2} dot={{ r: 3, fill: '#f87171' }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-emerald-400 inline-block rounded" /> Ingresos</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-red-400 inline-block rounded" /> Gastos</span>
          </div>
        </div>

        <div className="card space-y-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Estado de facturas</p>
          {invoiceStatus.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin facturas registradas</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={invoiceStatus} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                    {invoiceStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {invoiceStatus.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>{s.name}</span>
                    </div>
                    <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-2)' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card space-y-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Ingresos por servicio</p>
          {revenueByCategory.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin datos de items en facturas</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenueByCategory} layout="vertical" barCategoryGap="25%">
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" name="Ingresos" fill="#34d399" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card space-y-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Top clientes por facturación</p>
          {topClients.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin clientes con facturas</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((c, i) => {
                const pct = topClients[0].total > 0 ? Math.round(c.total / topClients[0].total * 100) : 0
                return (
                  <div key={c.client}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono w-4 flex-shrink-0" style={{ color: 'var(--text-3)' }}>#{i+1}</span>
                        <span className="text-xs truncate" style={{ color: 'var(--text-1)' }}>{c.client}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] ${statusColor[c.status] ?? ''}`}>{statusLabelMap[c.status] ?? c.status}</span>
                        <span className="text-xs font-mono font-semibold text-emerald-400">RD$ {c.total.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full h-1 rounded-full bg-gray-800">
                      <div className="h-1 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
