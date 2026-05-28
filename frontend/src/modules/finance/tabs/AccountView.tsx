import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Wallet, Search, Loader2 } from 'lucide-react'
import Badge from '@/components/Badge'
import StatCard from '@/components/StatCard'
import Pagination from '@/components/Pagination'
import { TransactionsService, type Transaction } from '@/lib/services/transactions.service'

interface AccountViewProps {
  type: 'personal' | 'brand'
}

const catVariant: Record<string, 'green'|'blue'|'purple'|'amber'|'cyan'|'gray'|'red'> = {
  saas: 'green', SaaS: 'green', freelance: 'blue', Freelance: 'blue',
  facturacion: 'green', Consultoría: 'purple', Hosting: 'amber',
  Dominios: 'cyan', Herramientas: 'gray', Marketing: 'red', Personal: 'gray', Otro: 'gray',
  Infra: 'amber', infra: 'amber',
}

const PER_PAGE = 10

export default function AccountView({ type: _type }: AccountViewProps) {
  const [txns,    setTxns]    = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)

  useEffect(() => {
    TransactionsService.list()
      .then(setTxns)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthLabel = now.toLocaleString('es-DO', { month: 'long', year: 'numeric' })

  const thisMonth = txns.filter(t => t.date?.startsWith(monthKey))
  const income    = thisMonth.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
  const expense   = thisMonth.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
  const balance   = txns.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
               - txns.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)

  const filtered  = txns.filter(t =>
    !search || t.description?.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-emerald-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Balance total" value={`RD$ ${balance.toLocaleString()}`} icon={Wallet}
          color={balance >= 0 ? 'bg-emerald-600' : 'bg-red-600'} />
        <StatCard title={`Ingresos (${monthLabel})`} value={`RD$ ${income.toLocaleString()}`}
          icon={TrendingUp} color="bg-blue-600" />
        <StatCard title={`Gastos (${monthLabel})`} value={`RD$ ${expense.toLocaleString()}`}
          icon={TrendingDown} color="bg-red-600" />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
            <input
              className="input pl-9 py-1.5 text-xs"
              placeholder="Buscar transacción..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <p className="text-xs ml-4" style={{ color: 'var(--text-3)' }}>
            {filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        {txns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Wallet size={28} className="text-gray-600" />
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin movimientos. Registra desde Caja.</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header w-10"></th>
                  <th className="table-header">Descripción</th>
                  <th className="table-header">Categoría</th>
                  <th className="table-header">Cuenta</th>
                  <th className="table-header">Fecha</th>
                  <th className="table-header text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr key={t.id} className="table-row">
                    <td className="table-cell">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        t.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                      }`}>
                        {t.type === 'income'
                          ? <ArrowUpRight size={14} className="text-emerald-400" />
                          : <ArrowDownLeft size={14} className="text-red-400" />
                        }
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm" style={{ color: 'var(--text-1)' }}>{t.description}</span>
                    </td>
                    <td className="table-cell">
                      <Badge variant={catVariant[t.category] ?? 'gray'}>{t.category}</Badge>
                    </td>
                    <td className="table-cell text-xs" style={{ color: 'var(--text-3)' }}>{t.account ?? '—'}</td>
                    <td className="table-cell text-xs font-mono" style={{ color: 'var(--text-3)' }}>{t.date}</td>
                    <td className={`table-cell text-right font-mono text-sm font-medium ${
                      t.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}RD$ {Number(t.amount).toLocaleString()}
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
  )
}
