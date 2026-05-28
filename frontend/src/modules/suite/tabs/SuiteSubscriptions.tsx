import { useState, useEffect } from 'react'
import { XCircle, Clock, CheckCircle, AlertCircle, CreditCard, Loader2, X, Settings } from 'lucide-react'
import Badge from '@/components/Badge'
import {
  SaasCompaniesService, SaasPlansService,
  type SaasCompany, type SaasPlan,
} from '@/lib/services/saas.service'
import api from '@/lib/api'

function getSubStatus(c: SaasCompany): 'active' | 'expired' | 'trial' | 'suspended' {
  if (c.status === 'suspended' || c.status === 'cancelled') return 'suspended'
  if (c.status === 'trial') return 'trial'
  if (c.subscription_ends_at && new Date(c.subscription_ends_at) < new Date()) return 'expired'
  return 'active'
}

const statusMap = {
  active:    { label: 'Activa',      color: 'green' as const, icon: CheckCircle },
  expired:   { label: 'Vencida',    color: 'red'   as const, icon: XCircle },
  trial:     { label: 'Trial',      color: 'amber' as const, icon: Clock },
  suspended: { label: 'Suspendida', color: 'red'   as const, icon: XCircle },
}

export function SuiteSubscriptions() {
  const [companies, setCompanies] = useState<SaasCompany[]>([])
  const [plans, setPlans]         = useState<SaasPlan[]>([])
  const [loading, setLoading]     = useState(true)

  const [manageFor, setManageFor]     = useState<SaasCompany | null>(null)
  const [manageForm, setManageForm]   = useState({ plan_id: '', status: '', subscription_ends_at: '' })
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    Promise.all([SaasCompaniesService.list(), SaasPlansService.list()])
      .then(([c, p]) => { setCompanies(c); setPlans(p) })
      .finally(() => setLoading(false))
  }, [])

  const openManage = (c: SaasCompany) => {
    setManageFor(c)
    setManageForm({
      plan_id: c.plan_id ? String(c.plan_id) : '',
      status: c.status,
      subscription_ends_at: c.subscription_ends_at ?? '',
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manageFor) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { status: manageForm.status }
      if (manageForm.plan_id) payload.plan_id = parseInt(manageForm.plan_id)
      if (manageForm.subscription_ends_at) payload.subscription_ends_at = manageForm.subscription_ends_at

      const updated = await api.put<SaasCompany>(`/suite/companies/${manageFor.id}`, payload).then(r => r.data)
      setCompanies(prev => prev.map(c => c.id === manageFor.id ? { ...c, ...updated } : c))
      setManageFor(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        ?? (err instanceof Error ? err.message : 'Error al guardar')
      alert(msg)
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--text-3)' }} />
    </div>
  )

  const visible = companies.filter(c => c.status !== 'cancelled')

  if (visible.length === 0) return (
    <div className="card text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>
      No hay empresas registradas.
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Manage modal */}
      {manageFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Gestionar suscripción</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{manageFor.name}</p>
              </div>
              <button onClick={() => setManageFor(null)} className="p-1 text-gray-500 hover:text-gray-300"><X size={16} /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-4 space-y-4">
              <div>
                <label className="label">Estado</label>
                <select className="input" value={manageForm.status}
                  onChange={e => setManageForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="trial">Trial</option>
                  <option value="active">Activa</option>
                  <option value="suspended">Suspendida</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <div>
                <label className="label">Plan</label>
                <select className="input" value={manageForm.plan_id}
                  onChange={e => setManageForm(f => ({ ...f, plan_id: e.target.value }))}>
                  <option value="">— Sin plan —</option>
                  {plans.filter(p => p.active).map(p => (
                    <option key={p.id} value={p.id}>{p.name} — RD$ {p.price.toLocaleString()}/{p.cycle === 'annual' ? 'año' : 'mes'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Vencimiento de suscripción</label>
                <input type="date" className="input" value={manageForm.subscription_ends_at}
                  onChange={e => setManageForm(f => ({ ...f, subscription_ends_at: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setManageFor(null)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : 'Guardar'}
                </button>
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
              <th className="table-header">Empresa</th>
              <th className="table-header">Plan</th>
              <th className="table-header">Vencimiento</th>
              <th className="table-header text-right">Precio</th>
              <th className="table-header">Ciclo</th>
              <th className="table-header">Estado</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map(c => {
              const subStatus = getSubStatus(c)
              const st = statusMap[subStatus]
              const daysLeft = c.subscription_ends_at
                ? Math.ceil((new Date(c.subscription_ends_at).getTime() - Date.now()) / 86400000)
                : null

              const iconBg =
                subStatus === 'expired' || subStatus === 'suspended' ? 'bg-red-500/10' :
                subStatus === 'trial' ? 'bg-amber-500/10' :
                daysLeft !== null && daysLeft < 60 ? 'bg-amber-500/10' : 'bg-emerald-500/10'

              const IconEl =
                subStatus === 'expired' || subStatus === 'suspended' ? XCircle :
                subStatus === 'trial' ? Clock :
                daysLeft !== null && daysLeft < 60 ? AlertCircle : CreditCard

              const iconColor =
                subStatus === 'expired' || subStatus === 'suspended' ? 'text-red-400' :
                subStatus === 'trial' || (daysLeft !== null && daysLeft < 60) ? 'text-amber-400' :
                'text-emerald-400'

              return (
                <tr key={c.id} className="table-row">
                  <td className="table-cell">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                      <IconEl size={15} className={iconColor} />
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{c.name}</p>
                    <p className="text-[10px] font-mono" style={{ color: 'var(--text-3)' }}>{c.subdomain}.leymaken.com</p>
                  </td>
                  <td className="table-cell text-xs" style={{ color: 'var(--text-2)' }}>
                    {c.plan?.name ?? <span style={{ color: 'var(--text-3)' }}>—</span>}
                  </td>
                  <td className="table-cell">
                    {c.subscription_ends_at ? (
                      <>
                        <p className="text-xs" style={{ color: 'var(--text-2)' }}>{c.subscription_ends_at}</p>
                        {subStatus === 'active' && daysLeft !== null && daysLeft < 60 && (
                          <p className="text-xs text-amber-400 flex items-center gap-1 mt-0.5">
                            <AlertCircle size={10} /> {daysLeft}d
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>—</span>
                    )}
                  </td>
                  <td className="table-cell text-right font-mono text-sm text-emerald-400">
                    {c.plan && c.plan.price > 0
                      ? `RD$ ${c.plan.price.toLocaleString()}`
                      : <span style={{ color: 'var(--text-3)' }}>—</span>}
                  </td>
                  <td className="table-cell text-xs" style={{ color: 'var(--text-3)' }}>
                    {c.plan?.cycle === 'annual' ? 'Anual' : c.plan?.cycle === 'monthly' ? 'Mensual' : '—'}
                  </td>
                  <td className="table-cell">
                    <Badge variant={st.color}>{st.label}</Badge>
                  </td>
                  <td className="table-cell">
                    <button onClick={() => openManage(c)}
                      className="p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Gestionar">
                      <Settings size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
