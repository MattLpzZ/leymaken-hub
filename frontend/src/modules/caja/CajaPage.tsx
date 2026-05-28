import { useState, useEffect } from 'react'
import { Plus, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft, Trash2, Loader2, X } from 'lucide-react'
import Badge from '@/components/Badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TransactionsService, type Transaction } from '@/lib/services/transactions.service'

type TxType = 'income' | 'expense'
type TxCategory = 'SaaS' | 'Freelance' | 'Consultoría' | 'Hosting' | 'Dominios' | 'Herramientas' | 'Marketing' | 'Personal' | 'Otro'

const catVariant: Record<string, 'green'|'blue'|'purple'|'amber'|'cyan'|'gray'|'red'> = {
  SaaS: 'green', Freelance: 'blue', Consultoría: 'purple', Hosting: 'amber',
  Dominios: 'cyan', Herramientas: 'gray', Marketing: 'red', Personal: 'gray', Otro: 'gray',
  facturacion: 'green', saas: 'green', freelance: 'blue',
}

const CATEGORIES: TxCategory[] = ['SaaS','Freelance','Consultoría','Hosting','Dominios','Herramientas','Marketing','Personal','Otro']
const ACCOUNTS = ['Banreservas','PayPal','Tarjeta','Efectivo','Otro']
const MONTH_NAMES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const BLANK = { description: '', category: 'Otro' as TxCategory, type: 'income' as TxType, amount: '', date: new Date().toISOString().slice(0,10), account: 'Banreservas' }

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-xs space-y-1 shadow-xl">
      <p className="font-semibold text-gray-300 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name === 'ingresos' ? 'Ingresos' : 'Gastos'}: RD$ {Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function CajaPage() {
  const [txns, setTxns]           = useState<Transaction[]>([])
  const [chart, setChart]         = useState<{ mes: string; ingresos: number; gastos: number }[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(BLANK)
  const [filterType, setFilterType] = useState<TxType | 'all'>('all')

  useEffect(() => {
    Promise.all([
      TransactionsService.list(),
      TransactionsService.monthlySummary(new Date().getFullYear()),
    ]).then(([txList, summary]) => {
      setTxns(txList)
      const now = new Date()
      const last6 = summary
        .filter(s => {
          const d = new Date(now.getFullYear(), s.month - 1)
          const sixAgo = new Date(now.getFullYear(), now.getMonth() - 5)
          return d >= sixAgo && d <= now
        })
        .map(s => ({ mes: MONTH_NAMES[s.month], ingresos: s.income, gastos: s.expense }))
      setChart(last6)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const income  = txns.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
  const expense = txns.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
  const balance = income - expense

  const filtered = txns
    .filter(t => filterType === 'all' || t.type === filterType)
    .sort((a, b) => b.date.localeCompare(a.date))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await TransactionsService.create({
        ...form,
        amount: parseFloat(form.amount as any),
        category: form.category.toLowerCase(),
      })
      setTxns(prev => [created, ...prev])
      setForm(BLANK)
      setShowForm(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    setTxns(prev => prev.filter(t => t.id !== id))
    try { await TransactionsService.remove(id) } catch { /* optimistic */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-3 gap-4">
        <div className="card space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Balance</p>
            <Wallet size={15} className={balance >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            RD$ {balance.toLocaleString()}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>saldo neto acumulado</p>
        </div>
        <div className="card space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Ingresos</p>
            <TrendingUp size={15} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">RD$ {income.toLocaleString()}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{txns.filter(t=>t.type==='income').length} entradas</p>
        </div>
        <div className="card space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Gastos</p>
            <TrendingDown size={15} className="text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">RD$ {expense.toLocaleString()}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{txns.filter(t=>t.type==='expense').length} salidas</p>
        </div>
      </div>

      {chart.length > 0 && (
        <div className="card space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Flujo mensual</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chart} barGap={4} barCategoryGap="30%">
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false}
                tickFormatter={v => v === 0 ? '0' : `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="ingresos" fill="#34d399" radius={[4,4,0,0]} />
              <Bar dataKey="gastos"   fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Ingresos</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Gastos</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['all','income','expense'] as const).map(f => (
            <button key={f} onClick={() => setFilterType(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filterType===f ? 'bg-emerald-600/15 border-emerald-500/25 text-emerald-400' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}>
              {f === 'all' ? 'Todos' : f === 'income' ? 'Ingresos' : 'Gastos'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs py-1.5">
          <Plus size={13} /> Registrar movimiento
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Nuevo movimiento</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Descripción</label>
                <input required className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TxType }))}>
                    <option value="income">Ingreso</option>
                    <option value="expense">Gasto</option>
                  </select>
                </div>
                <div>
                  <label className="label">Categoría</label>
                  <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as TxCategory }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Monto (RD$)</label>
                  <input required type="number" min="0" className="input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Cuenta</label>
                  <select className="input" value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))}>
                    {ACCOUNTS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Fecha</label>
                <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2" disabled={saving}>
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>No hay movimientos registrados</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-10"></th>
                <th className="table-header">Descripción</th>
                <th className="table-header">Categoría</th>
                <th className="table-header">Cuenta</th>
                <th className="table-header">Fecha</th>
                <th className="table-header text-right">Monto</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="table-row">
                  <td className="table-cell">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      {t.type === 'income'
                        ? <ArrowUpRight size={14} className="text-emerald-400" />
                        : <ArrowDownLeft size={14} className="text-red-400" />
                      }
                    </div>
                  </td>
                  <td className="table-cell text-sm" style={{ color: 'var(--text-1)' }}>{t.description}</td>
                  <td className="table-cell">
                    <Badge variant={catVariant[t.category] ?? 'gray'}>{t.category}</Badge>
                  </td>
                  <td className="table-cell text-xs" style={{ color: 'var(--text-3)' }}>{t.account ?? '—'}</td>
                  <td className="table-cell text-xs font-mono" style={{ color: 'var(--text-3)' }}>{t.date}</td>
                  <td className={`table-cell text-right font-mono text-sm font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}RD$ {Number(t.amount).toLocaleString()}
                  </td>
                  <td className="table-cell">
                    <button onClick={() => remove(t.id!)} className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
