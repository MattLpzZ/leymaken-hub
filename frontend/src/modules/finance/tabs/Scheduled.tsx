import { useState, useEffect } from 'react'
import { Plus, Play, Pause, Trash2, CalendarClock, RefreshCw, CheckCircle, X } from 'lucide-react'
import Badge from '@/components/Badge'
import { ScheduledService } from '@/lib/services/scheduled.service'

interface ScheduledTx {
  id: number
  description: string
  category: string
  amount: number
  type: 'income' | 'expense'
  account: 'personal' | 'brand'
  frequency: 'monthly' | 'biweekly' | 'weekly' | 'yearly'
  nextDate: string
  active: boolean
  dayOfMonth?: number
}

const FREQ_LABEL: Record<string, string> = {
  monthly:  'Mensual',
  biweekly: 'Quincenal',
  weekly:   'Semanal',
  yearly:   'Anual',
}

const FREQ_COLOR: Record<string, 'blue' | 'purple' | 'cyan' | 'amber'> = {
  monthly:  'blue',
  biweekly: 'purple',
  weekly:   'cyan',
  yearly:   'amber',
}

const formatDOP = (n: number, type: 'income' | 'expense') =>
  `${type === 'income' ? '+' : '-'}RD$ ${n.toLocaleString()}`

const DEFAULT_FORM = {
  description: '', category: '', amount: '', type: 'expense' as 'income'|'expense',
  account: 'personal' as 'personal'|'brand', frequency: 'monthly' as ScheduledTx['frequency'],
  dayOfMonth: '', nextDate: '',
}

export default function Scheduled() {
  const [items, setItems]       = useState<ScheduledTx[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(DEFAULT_FORM)
  const [toast, setToast]       = useState<string | null>(null)

  useEffect(() => {
    ScheduledService.list()
      .then(data => {
        setItems(data.map(s => ({
          id:          s.id,
          description: s.description,
          category:    s.category,
          amount:      s.amount,
          type:        s.type,
          account:     s.account,
          frequency:   s.frequency,
          nextDate:    s.next_date,
          active:      s.active,
          dayOfMonth:  s.day_of_month ?? undefined,
        })))
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const toggleActive = async (id: number) => {
    try {
      const updated = await ScheduledService.toggle(id)
      setItems(prev => prev.map(i => i.id === id ? { ...i, active: updated.active } : i))
    } catch (e) { console.error(e) }
  }

  const removeItem = async (id: number) => {
    try {
      await ScheduledService.delete(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (e) { console.error(e) }
  }

  const executeNow = async (item: ScheduledTx) => {
    try {
      const updated = await ScheduledService.execute(item.id)
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, nextDate: updated.next_date } : i))
      setToast(`"${item.description}" registrado — próxima fecha: ${updated.next_date}`)
      setTimeout(() => setToast(null), 4000)
    } catch (e) { console.error(e) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const created = await ScheduledService.create({
        description:  form.description,
        category:     form.category || 'General',
        amount:       parseFloat(form.amount),
        type:         form.type,
        account:      form.account,
        frequency:    form.frequency,
        next_date:    form.nextDate || new Date().toISOString().split('T')[0],
        day_of_month: form.dayOfMonth ? parseInt(form.dayOfMonth) : null,
        active:       true,
      })
      setItems(prev => [...prev, {
        id:          created.id,
        description: created.description,
        category:    created.category,
        amount:      created.amount,
        type:        created.type,
        account:     created.account,
        frequency:   created.frequency,
        nextDate:    created.next_date,
        active:      created.active,
        dayOfMonth:  created.day_of_month ?? undefined,
      }])
      setForm(DEFAULT_FORM)
      setShowForm(false)
    } catch (e) { console.error(e) }
  }

  const totalMonthlyExpenses = items.filter(i => i.active && i.type === 'expense').reduce((a, i) => {
    if (i.frequency === 'monthly') return a + i.amount
    if (i.frequency === 'biweekly') return a + i.amount * 2
    if (i.frequency === 'weekly') return a + i.amount * 4
    if (i.frequency === 'yearly') return a + i.amount / 12
    return a
  }, 0)

  const totalMonthlyIncome = items.filter(i => i.active && i.type === 'income').reduce((a, i) => {
    if (i.frequency === 'monthly') return a + i.amount
    if (i.frequency === 'biweekly') return a + i.amount * 2
    if (i.frequency === 'weekly') return a + i.amount * 4
    if (i.frequency === 'yearly') return a + i.amount / 12
    return a
  }, 0)

  return (
    <div className="space-y-5">

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm text-emerald-300 border border-emerald-500/20 bg-gray-900">
          <CheckCircle size={15} className="text-emerald-400" /> {toast}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="card-sm text-center">
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Gastos mensuales estimados</p>
          <p className="text-xl font-bold text-red-400 mt-1">RD$ {Math.round(totalMonthlyExpenses).toLocaleString()}</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Ingresos recurrentes</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">RD$ {Math.round(totalMonthlyIncome).toLocaleString()}</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Balance neto estimado</p>
          <p className={`text-xl font-bold mt-1 ${totalMonthlyIncome - totalMonthlyExpenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            RD$ {Math.round(totalMonthlyIncome - totalMonthlyExpenses).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          {loading ? 'Cargando...' : `${items.filter(i => i.active).length} activos · ${items.filter(i => !i.active).length} pausados`}
        </p>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs py-1.5">
          <Plus size={13} /> Nuevo Programado
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                <CalendarClock size={15} className="text-emerald-400" /> Nuevo movimiento programado
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Descripción</label>
                <input required className="input" placeholder="Ej: Netflix, Hosting, Salario..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Monto (RD$)</label>
                  <input required type="number" min="1" className="input" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Categoría</label>
                  <input className="input" placeholder="Servicios, Infra, Personal..." value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'income'|'expense' }))}>
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso</option>
                  </select>
                </div>
                <div>
                  <label className="label">Cuenta</label>
                  <select className="input" value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value as 'personal'|'brand' }))}>
                    <option value="personal">Personal</option>
                    <option value="brand">Soy Matt</option>
                  </select>
                </div>
                <div>
                  <label className="label">Frecuencia</label>
                  <select className="input" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as ScheduledTx['frequency'] }))}>
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="label">Próxima fecha</label>
                  <input type="date" className="input" value={form.nextDate} onChange={e => setForm(f => ({ ...f, nextDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header w-10"></th>
              <th className="table-header">Descripción</th>
              <th className="table-header">Cuenta</th>
              <th className="table-header">Frecuencia</th>
              <th className="table-header">Próxima fecha</th>
              <th className="table-header text-right">Monto</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="table-cell text-center text-sm py-8" style={{ color: 'var(--text-3)' }}>Cargando...</td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="table-cell text-center text-sm py-8" style={{ color: 'var(--text-3)' }}>No hay movimientos programados.</td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className={`table-row ${!item.active ? 'opacity-50' : ''}`}>
                <td className="table-cell">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    <RefreshCw size={14} className={item.type === 'income' ? 'text-emerald-400' : 'text-red-400'} />
                  </div>
                </td>
                <td className="table-cell">
                  <p className="font-medium text-sm" style={{ color: 'var(--text-1)' }}>{item.description}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{item.category}</p>
                </td>
                <td className="table-cell">
                  <Badge variant={item.account === 'personal' ? 'gray' : 'blue'}>
                    {item.account === 'personal' ? 'Personal' : 'Soy Matt'}
                  </Badge>
                </td>
                <td className="table-cell">
                  <Badge variant={FREQ_COLOR[item.frequency]}>{FREQ_LABEL[item.frequency]}</Badge>
                </td>
                <td className="table-cell text-xs" style={{ color: 'var(--text-3)' }}>{item.nextDate}</td>
                <td className={`table-cell text-right font-mono text-sm font-semibold ${item.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatDOP(item.amount, item.type)}
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => executeNow(item)} title="Registrar pago ahora"
                      className="p-1.5 rounded-md text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                      <Play size={13} />
                    </button>
                    <button onClick={() => toggleActive(item.id)} title={item.active ? 'Pausar' : 'Activar'}
                      className="p-1.5 rounded-md text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                      {item.active ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
                    </button>
                    <button onClick={() => removeItem(item.id)} title="Eliminar"
                      className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
