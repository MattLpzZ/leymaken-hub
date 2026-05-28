import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Building2, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react'
import Badge from '@/components/Badge'
import {
  SaasPlansService, SaasCompaniesService, SaasSuitesService,
  type SaasPlan, type SaasCompany, type SaasSuite,
} from '@/lib/services/saas.service'

const BLANK_FORM = {
  name: '', price: '', cycle: 'monthly' as 'monthly' | 'annual',
  max_users: '5', description: '', modules: [] as string[],
}

export function SuitePlans() {
  const [plans, setPlans]           = useState<SaasPlan[]>([])
  const [companies, setCompanies]   = useState<SaasCompany[]>([])
  const [suites, setSuites]         = useState<SaasSuite[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState<number | null>(null)
  const [form, setForm]             = useState(BLANK_FORM)
  const [expanded, setExpanded]     = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      SaasPlansService.list(),
      SaasCompaniesService.list(),
      SaasSuitesService.list(),
    ]).then(([p, c, s]) => { setPlans(p); setCompanies(c); setSuites(s) })
      .finally(() => setLoading(false))
  }, [])

  const toggleSuite = (key: string) =>
    setForm(f => ({
      ...f,
      modules: f.modules.includes(key) ? f.modules.filter(m => m !== key) : [...f.modules, key],
    }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const payload = {
      name: form.name, price: parseFloat(form.price), cycle: form.cycle,
      max_users: parseInt(form.max_users), description: form.description, modules: form.modules,
    }
    try {
      if (editingId !== null) {
        const updated = await SaasPlansService.update(editingId, payload)
        setPlans(prev => prev.map(p => p.id === editingId ? updated : p))
        setEditingId(null)
      } else {
        const created = await SaasPlansService.create(payload)
        setPlans(prev => [...prev, created])
      }
      setForm(BLANK_FORM)
      setShowForm(false)
    } finally { setSubmitting(false) }
  }

  const startEdit = (p: SaasPlan) => {
    setForm({
      name: p.name, price: String(p.price), cycle: p.cycle,
      max_users: String(p.max_users), description: p.description ?? '', modules: p.modules ?? [],
    })
    setEditingId(p.id)
    setShowForm(true)
  }

  const handleToggle = async (plan: SaasPlan) => {
    const next = !plan.active
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, active: next } : p))
    try { await SaasPlansService.update(plan.id, { active: next }) }
    catch { setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, active: plan.active } : p)) }
  }

  const handleDelete = async (plan: SaasPlan) => {
    if ((plan.companies_count ?? 0) > 0) return
    setPlans(prev => prev.filter(p => p.id !== plan.id))
    try { await SaasPlansService.remove(plan.id) }
    catch { setPlans(prev => [...prev, plan]) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--text-3)' }} />
    </div>
  )

  const activeCompanies = companies.filter(c => c.status === 'active').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          {plans.filter(p => p.active).length} planes activos · {activeCompanies} empresas suscritas
        </p>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(BLANK_FORM) }}
          className="btn-primary text-xs py-1.5">
          <Plus size={13} /> Nuevo Plan
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{editingId !== null ? 'Editar plan' : 'Nuevo plan'}</p>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="p-1 text-gray-500 hover:text-gray-300"><X size={16} /></button>
            </div>
            <div className="px-6 py-4 overflow-y-auto max-h-[75vh]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="label">Nombre del plan</label>
                    <input required className="input" placeholder="Suite Pro..."
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Precio base (RD$)</label>
                    <input required type="number" min="0" step="0.01" className="input" placeholder="0"
                      value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Ciclo de facturación</label>
                    <select className="input" value={form.cycle}
                      onChange={e => setForm(f => ({ ...f, cycle: e.target.value as 'monthly' | 'annual' }))}>
                      <option value="monthly">Mensual</option>
                      <option value="annual">Anual</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Máx. usuarios</label>
                    <input required type="number" min="1" className="input" placeholder="5"
                      value={form.max_users} onChange={e => setForm(f => ({ ...f, max_users: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Descripción corta</label>
                    <input className="input" placeholder="El plan más popular..."
                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="label mb-2">Suites incluidas en este plan</label>
                  {suites.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>Cargando suites...</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {suites.map(suite => {
                        const selected = form.modules.includes(suite.key)
                        return (
                          <button key={suite.key} type="button" onClick={() => toggleSuite(suite.key)}
                            className={`flex items-start gap-3 px-4 py-3 rounded-xl text-left border transition-colors ${
                              selected
                                ? 'border-emerald-500/50 bg-emerald-500/10'
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}>
                            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                              selected ? 'bg-emerald-500' : 'border border-gray-600'
                            }`}>
                              {selected && <Check size={11} className="text-white" />}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${selected ? 'text-emerald-300' : ''}`}
                                style={{ color: selected ? undefined : 'var(--text-1)' }}>
                                {suite.label}
                              </p>
                              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                                {suite.modules.map(m => m.label).join(' · ')}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {form.modules.length === 0 && (
                    <p className="text-[10px] mt-2" style={{ color: 'var(--text-3)' }}>
                      Selecciona al menos una suite para este plan.
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }}
                    className="btn-secondary flex-1">Cancelar</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1">
                    {submitting ? <Loader2 size={13} className="animate-spin" />
                      : editingId !== null ? 'Guardar cambios' : 'Crear plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {plans.length === 0 ? (
          <div className="card text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>
            No hay planes registrados.
          </div>
        ) : plans.map(plan => {
          const assigned   = companies.filter(c => c.plan_id === plan.id)
          const isExpanded = expanded === plan.id
          const canDelete  = (plan.companies_count ?? assigned.length) === 0
          const planSuites = (plan.modules ?? [])
            .map(key => suites.find(s => s.key === key))
            .filter(Boolean) as SaasSuite[]

          return (
            <div key={plan.id} className={`card p-0 overflow-hidden transition-opacity ${!plan.active ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-4 p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{plan.name}</p>
                    <Badge variant={plan.active ? 'green' : 'gray'}>{plan.active ? 'Activo' : 'Inactivo'}</Badge>
                    {assigned.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-mono">
                        {assigned.length} empresa{assigned.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{plan.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {planSuites.length > 0
                      ? planSuites.map(s => <Badge key={s.key} variant="blue">{s.label}</Badge>)
                      : <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>Sin suites asignadas</span>}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-emerald-400">
                    {plan.price > 0 ? `RD$ ${plan.price.toLocaleString()}` : 'Negociable'}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                    por {plan.cycle === 'annual' ? 'año' : 'mes'} · hasta {plan.max_users === 999 ? '∞' : plan.max_users} usuarios
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {assigned.length > 0 && (
                    <button onClick={() => setExpanded(isExpanded ? null : plan.id)}
                      className="p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Ver empresas">
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                  <button onClick={() => startEdit(plan)}
                    className="p-1.5 rounded-md text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Editar">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleToggle(plan)}
                    className={`p-1.5 rounded-md transition-colors ${plan.active
                      ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                      : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                    title={plan.active ? 'Desactivar' : 'Activar'}>
                    <X size={13} />
                  </button>
                  {canDelete && (
                    <button onClick={() => handleDelete(plan)}
                      className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Eliminar plan">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && assigned.length > 0 && (
                <div className="border-t border-gray-800 bg-gray-800/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 px-5 py-2">
                    Empresas en este plan
                  </p>
                  {assigned.map(co => (
                    <div key={co.id} className="flex items-center gap-3 px-5 py-2.5 border-t border-gray-800/50">
                      <Building2 size={13} className={co.status === 'active' ? 'text-emerald-400' : 'text-red-400'} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>{co.name}</p>
                        <p className="text-[10px] font-mono" style={{ color: 'var(--text-3)' }}>{co.subdomain}.leymaken.com</p>
                      </div>
                      <Badge variant={co.status === 'active' ? 'green' : 'red'}>
                        {co.status === 'active' ? 'Activa' : 'Suspendida'}
                      </Badge>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-3)' }}>
                        vence {co.subscription_ends_at ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
