import { useEffect, useState } from 'react'
import { Search, Users, DollarSign, Briefcase } from 'lucide-react'
import bizApi from '@/lib/bizApi'
import { useBizAuthStore } from '@/stores/bizAuthStore'
import { BizConnectPrompt } from '@/components/BizConnectPrompt'

interface Client {
  id: number
  name: string
  email: string | null
  phone: string | null
  company: string | null
  type: 'saas' | 'freelance' | 'project' | null
  plan: string | null
  monthly_fee: string | null
  billing_day: number | null
  notes: string | null
}

const TYPE_LABEL: Record<string, string> = { saas: 'SaaS', freelance: 'Freelance', project: 'Proyecto' }
const TYPE_COLOR: Record<string, string> = { saas: 'badge-green', freelance: 'badge-yellow', project: 'badge-gray' }

function fmt(amount: string | null, currency = 'DOP') {
  if (!amount) return '—'
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount))
}

export function CrmPage() {
  const { token } = useBizAuthStore()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    bizApi.get('/clients').then(r => setClients(r.data)).finally(() => setLoading(false))
  }, [token])

  if (!token) return <BizConnectPrompt />

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  )

  const mrr = clients
    .filter(c => c.type === 'saas' && c.monthly_fee)
    .reduce((s, c) => s + Number(c.monthly_fee), 0)

  const saasCount     = clients.filter(c => c.type === 'saas').length
  const freelanceCount = clients.filter(c => c.type === 'freelance').length
  const projectCount  = clients.filter(c => c.type === 'project').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>CRM — Clientes</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total clientes', value: clients.length, icon: Users,       color: '#6366f1' },
          { label: 'MRR (SaaS)',     value: fmt(String(mrr)), icon: DollarSign, color: '#10b981' },
          { label: 'SaaS',           value: saasCount,       icon: Briefcase,  color: '#10b981' },
          { label: 'Freelance / Proyecto', value: `${freelanceCount} / ${projectCount}`, icon: Briefcase, color: '#f59e0b' },
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

      {/* Search + table */}
      <div className="card space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            className="input w-full pl-8 text-sm"
            placeholder="Buscar por nombre, email o empresa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text-3)' }}>Cargando...</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map(c => (
              <div key={c.id} className="flex items-center gap-3 py-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{c.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {c.company && <span>{c.company} · </span>}
                    {c.email ?? 'Sin email'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.type && <span className={`badge ${TYPE_COLOR[c.type] ?? 'badge-gray'}`}>{TYPE_LABEL[c.type] ?? c.type}</span>}
                  {c.monthly_fee && Number(c.monthly_fee) > 0 && (
                    <span className="text-xs font-mono" style={{ color: 'var(--text-2)' }}>{fmt(c.monthly_fee)}/mo</span>
                  )}
                  {c.phone && <span className="text-xs hidden md:inline" style={{ color: 'var(--text-3)' }}>{c.phone}</span>}
                </div>
              </div>
            ))}
            {!filtered.length && (
              <p className="text-sm py-6 text-center" style={{ color: 'var(--text-3)' }}>Sin resultados</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
