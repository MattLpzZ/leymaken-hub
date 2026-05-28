import { useState, useEffect } from 'react'
import { CheckCircle, RefreshCw } from 'lucide-react'
import Badge from '@/components/Badge'
import { ScheduledService, type ScheduledTransaction } from '@/lib/services/scheduled.service'

const formatDOP = (n: number) => `RD$ ${Math.round(n).toLocaleString()}`

function getQuincena(dateStr: string): 'q15' | 'q30' {
  const day = new Date(dateStr + 'T00:00:00').getDate()
  return day <= 15 ? 'q15' : 'q30'
}

function currentQuincena(): 'q15' | 'q30' {
  return new Date().getDate() <= 15 ? 'q15' : 'q30'
}

export default function GastosFijos() {
  const [items, setItems]     = useState<ScheduledTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState<string | null>(null)
  const [paying, setPaying]   = useState<number | null>(null)

  useEffect(() => {
    ScheduledService.list()
      .then(data => setItems(data.filter(i => i.type === 'expense' && i.active)))
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const markPaid = async (item: ScheduledTransaction) => {
    setPaying(item.id)
    try {
      const updated = await ScheduledService.execute(item.id)
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, next_date: updated.next_date } : i))
      setToast(`"${item.description}" pagado — próxima fecha: ${updated.next_date}`)
      setTimeout(() => setToast(null), 4000)
    } catch (e) {
      console.error(e)
    } finally {
      setPaying(null)
    }
  }

  const curQ    = currentQuincena()
  const nextQ   = curQ === 'q15' ? 'q30' : 'q15'
  const curLabel  = curQ === 'q15' ? 'Q15 (1–15)' : 'Q30 (16–31)'
  const nextLabel = nextQ === 'q15' ? 'Q15 (1–15)' : 'Q30 (16–31)'

  const byQuincena = (q: 'q15' | 'q30') =>
    items.filter(i => getQuincena(i.next_date) === q)

  const totalQ = (q: 'q15' | 'q30') =>
    byQuincena(q).reduce((a, i) => a + i.amount, 0)

  const totalMonthly = items.reduce((a, i) => {
    if (i.frequency === 'monthly')  return a + i.amount
    if (i.frequency === 'biweekly') return a + i.amount * 2
    if (i.frequency === 'weekly')   return a + i.amount * 4
    if (i.frequency === 'yearly')   return a + i.amount / 12
    return a
  }, 0)

  const QuincenaSection = ({ q, label, highlight }: { q: 'q15' | 'q30'; label: string; highlight: boolean }) => {
    const rows = byQuincena(q)
    const total = totalQ(q)
    return (
      <div className={`card p-0 overflow-hidden ${highlight ? 'ring-1 ring-emerald-500/30' : ''}`}>
        <div className={`flex items-center justify-between px-5 py-3 border-b border-gray-800 ${highlight ? 'bg-emerald-500/5' : ''}`}>
          <div className="flex items-center gap-2">
            {highlight && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{label}</span>
            {highlight && <Badge variant="green">Esta quincena</Badge>}
          </div>
          <span className="text-sm font-bold text-red-400">{formatDOP(total)}</span>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-3)' }}>Sin gastos para esta quincena.</p>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {rows.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <RefreshCw size={13} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{item.description}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {item.category} · {item.next_date}
                  </p>
                </div>
                <span className="text-sm font-mono font-semibold text-red-400 flex-shrink-0">
                  {formatDOP(item.amount)}
                </span>
                <button
                  onClick={() => markPaid(item)}
                  disabled={paying === item.id}
                  title="Marcar como pagado"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                    border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 flex-shrink-0"
                >
                  <CheckCircle size={12} />
                  {paying === item.id ? '...' : 'Pagado'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm text-emerald-300 border border-emerald-500/20 bg-gray-900">
          <CheckCircle size={15} className="text-emerald-400" /> {toast}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-sm text-center">
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Esta quincena</p>
          <p className="text-xl font-bold text-red-400 mt-1">{formatDOP(totalQ(curQ))}</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Próxima quincena</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{formatDOP(totalQ(nextQ))}</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Estimado mensual</p>
          <p className="text-xl font-bold text-red-400 mt-1">{formatDOP(totalMonthly)}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--text-3)' }}>Cargando...</p>
      ) : (
        <>
          <QuincenaSection q={curQ}  label={curLabel}  highlight />
          <QuincenaSection q={nextQ} label={nextLabel} highlight={false} />
        </>
      )}
    </div>
  )
}
