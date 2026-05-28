import { useState, useEffect } from 'react'
import {
  Plus, Search, Building2, ShieldOff, ShieldCheck,
  AlertCircle as AlertIcon, Loader2, X, ExternalLink,
  Trash2, KeyRound, MoreVertical, Copy,
} from 'lucide-react'
import Badge from '@/components/Badge'
import StatCard from '@/components/StatCard'
import { Users, DollarSign, AlertCircle } from 'lucide-react'
import {
  SaasCompaniesService, SaasPlansService,
  type SaasCompany, type SaasPlan,
} from '@/lib/services/saas.service'

const formatDOP = (n: number) => `RD$ ${n.toLocaleString()}`

const BLANK_FORM = {
  name: '', subdomain: '', plan_id: '', contact_email: '',
  contact_phone: '', trial_ends_at: '', subscription_ends_at: '', notes: '',
}

export function SuiteCompanies() {
  const [companies, setCompanies]   = useState<SaasCompany[]>([])
  const [plans, setPlans]           = useState<SaasPlan[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(BLANK_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteFor, setDeleteFor] = useState<SaasCompany | null>(null)
  const [deleting, setDeleting]   = useState(false)

  const [resetFor, setResetFor]       = useState<SaasCompany | null>(null)
  const [resetUsers, setResetUsers]   = useState<{ id: number; name: string; email: string; role: string }[]>([])
  const [resetUserId, setResetUserId] = useState<number | null>(null)
  const [resetPass, setResetPass]     = useState('')
  const [resetting, setResetting]     = useState(false)
  const [resetDone, setResetDone]     = useState(false)

  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null)

  const [menuFor, setMenuFor] = useState<number | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)

  useEffect(() => {
    Promise.all([SaasCompaniesService.list(), SaasPlansService.list()])
      .then(([c, p]) => { setCompanies(c); setPlans(p) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (menuFor === null) return
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-menu]')) { setMenuFor(null); setMenuPos(null) }
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuFor])

  const getMRR = (c: SaasCompany) => {
    if (!c.plan || c.status === 'suspended') return 0
    const price = Number(c.plan.price)
    return c.plan.cycle === 'annual' ? Math.round(price / 12) : price
  }

  const active       = companies.filter(c => c.status === 'active').length
  const totalMRR     = companies.reduce((a, c) => a + getMRR(c), 0)
  const totalUsers   = companies.reduce((a, c) => a + (c.users_count ?? 0), 0)
  const expiringSoon = companies.filter(c => {
    if (!c.subscription_ends_at || c.status !== 'active') return false
    const diff = (new Date(c.subscription_ends_at).getTime() - Date.now()) / 86400000
    return diff >= 0 && diff < 30
  }).length

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subdomain.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggle = async (c: SaasCompany) => {
    const next = c.status === 'active' ? 'suspended' : 'active'
    setCompanies(prev => prev.map(x => x.id === c.id ? { ...x, status: next as SaasCompany['status'] } : x))
    try {
      if (c.status === 'active') await SaasCompaniesService.suspend(c.id)
      else await SaasCompaniesService.activate(c.id)
    } catch {
      setCompanies(prev => prev.map(x => x.id === c.id ? { ...x, status: c.status } : x))
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = { name: form.name, subdomain: form.subdomain }
      if (form.plan_id)              payload.plan_id              = parseInt(form.plan_id)
      if (form.contact_email)        payload.contact_email        = form.contact_email
      if (form.contact_phone)        payload.contact_phone        = form.contact_phone
      if (form.trial_ends_at)        payload.trial_ends_at        = form.trial_ends_at
      if (form.subscription_ends_at) payload.subscription_ends_at = form.subscription_ends_at
      if (form.notes)                payload.notes                = form.notes
      const res = await SaasCompaniesService.create(payload) as SaasCompany & { temp_password?: string }
      setCompanies(prev => [...prev, res])
      setForm(BLANK_FORM)
      setShowForm(false)
      if (res.temp_password) {
        const adminEmail = 'admin@' + form.subdomain + '.leymaken.com'
        setTempPassword({ email: adminEmail, password: res.temp_password })
      }
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!deleteFor) return
    setDeleting(true)
    try {
      await SaasCompaniesService.remove(deleteFor.id)
      setCompanies(prev => prev.filter(c => c.id !== deleteFor.id))
      setDeleteFor(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar empresa.'
      alert(msg)
    } finally { setDeleting(false) }
  }

  const openReset = async (c: SaasCompany) => {
    setResetFor(c)
    setResetPass('')
    setResetUserId(null)
    setResetDone(false)
    try {
      const users = await SaasCompaniesService.users(c.id)
      setResetUsers(users)
      const admin = users.find(u => u.role === 'admin')
      setResetUserId(admin?.id ?? users[0]?.id ?? null)
    } catch { setResetUsers([]) }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetFor || !resetUserId) return
    setResetting(true)
    try {
      await SaasCompaniesService.resetPassword(resetFor.id, resetUserId, resetPass)
      setResetDone(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al restablecer contraseña.'
      alert(msg)
    } finally { setResetting(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--text-3)' }} />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Empresas Activas"  value={active}              icon={Building2}   color="bg-emerald-600" />
        <StatCard title="MRR Total"         value={formatDOP(totalMRR)} icon={DollarSign}  color="bg-blue-600" />
        <StatCard title="Total Usuarios"    value={totalUsers}          icon={Users}       color="bg-purple-600" />
        <StatCard title="Vencen en 30 días" value={expiringSoon}        icon={AlertCircle} color="bg-amber-600" />
      </div>

      {/* Temp password modal */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border p-6 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
              <KeyRound size={22} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: 'var(--text-1)' }}>Empresa creada</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
                Guarda estas credenciales — no se volverán a mostrar.
              </p>
            </div>
            <div className="space-y-2 rounded-lg p-3 text-sm font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between gap-2">
                <span style={{ color: 'var(--text-3)' }}>Email</span>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--text-1)' }}>{tempPassword.email}</span>
                  <button onClick={() => navigator.clipboard.writeText(tempPassword.email)} className="p-0.5 text-gray-500 hover:text-gray-200"><Copy size={12} /></button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span style={{ color: 'var(--text-3)' }}>Contraseña</span>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--text-1)' }}>{tempPassword.password}</span>
                  <button onClick={() => navigator.clipboard.writeText(tempPassword.password)} className="p-0.5 text-gray-500 hover:text-gray-200"><Copy size={12} /></button>
                </div>
              </div>
            </div>
            <button onClick={() => setTempPassword(null)} className="btn-primary w-full justify-center">
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border p-6 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: 'var(--text-1)' }}>Eliminar empresa</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
                Esta acción eliminará <strong style={{ color: 'var(--text-1)' }}>{deleteFor.name}</strong> y todos sus usuarios permanentemente.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteFor(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <><Trash2 size={13} /> Eliminar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border p-6 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {resetDone ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck size={22} className="text-emerald-400" />
                </div>
                <p className="font-semibold" style={{ color: 'var(--text-1)' }}>Contraseña actualizada</p>
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>Las sesiones activas fueron revocadas.</p>
                <button onClick={() => setResetFor(null)} className="btn-primary w-full justify-center">Cerrar</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Restablecer contraseña</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{resetFor.name}</p>
                  </div>
                  <button onClick={() => setResetFor(null)} className="p-1.5 text-gray-500 hover:text-gray-300"><X size={16} /></button>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-3">
                  {resetUsers.length > 1 && (
                    <div><label className="label">Usuario</label>
                      <select className="input" value={resetUserId ?? ''} onChange={e => setResetUserId(Number(e.target.value))}>
                        {resetUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                      </select>
                    </div>
                  )}
                  {resetUsers.length === 0 && <p className="text-xs text-amber-400">Esta empresa no tiene usuarios.</p>}
                  <div><label className="label">Nueva contraseña</label>
                    <input required type="password" minLength={8} className="input" placeholder="Mínimo 8 caracteres"
                      value={resetPass} onChange={e => setResetPass(e.target.value)} />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setResetFor(null)} className="btn-secondary flex-1">Cancelar</button>
                    <button type="submit" disabled={resetting || !resetUserId} className="btn-primary flex-1">
                      {resetting ? <Loader2 size={13} className="animate-spin" /> : 'Restablecer'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* New company modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Nueva Empresa</p>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-500 hover:text-gray-300"><X size={16} /></button>
            </div>
            <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="label">Nombre de la empresa</label>
                    <input required className="input" placeholder="Ferretería Don Julio"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Subdominio</label>
                    <div className="flex items-center">
                      <input required className="input rounded-r-none" placeholder="ferrjulio"
                        value={form.subdomain}
                        onChange={e => setForm(f => ({ ...f, subdomain: e.target.value.toLowerCase().replace(/\s/g, '') }))} />
                      <span className="px-3 py-2 text-xs rounded-r-lg border border-l-0 border-gray-700 bg-gray-800 whitespace-nowrap"
                        style={{ color: 'var(--text-3)' }}>.leymaken.com</span>
                    </div>
                  </div>
                  <div>
                    <label className="label">Plan</label>
                    <select className="input" value={form.plan_id} onChange={e => setForm(f => ({ ...f, plan_id: e.target.value }))}>
                      <option value="">— Sin plan —</option>
                      {plans.filter(p => p.active).map(p => (
                        <option key={p.id} value={p.id}>{p.name} — RD$ {p.price.toLocaleString()}/{p.cycle === 'annual' ? 'año' : 'mes'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Email de contacto</label>
                    <input type="email" className="input" placeholder="contacto@empresa.com"
                      value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Teléfono</label>
                    <input className="input" placeholder="809-000-0000"
                      value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Fin de prueba</label>
                    <input type="date" className="input" value={form.trial_ends_at}
                      onChange={e => setForm(f => ({ ...f, trial_ends_at: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Vencimiento suscripción</label>
                    <input type="date" className="input" value={form.subscription_ends_at}
                      onChange={e => setForm(f => ({ ...f, subscription_ends_at: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Notas internas</label>
                    <input className="input" placeholder="Notas..." value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1">
                    {submitting ? <Loader2 size={13} className="animate-spin" /> : 'Crear empresa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
            <input className="input pl-9 py-1.5 text-xs" placeholder="Buscar empresa..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary text-xs py-1.5" onClick={() => setShowForm(true)}>
            <Plus size={13} /> Nueva Empresa
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header w-10"></th>
              <th className="table-header">Empresa</th>
              <th className="table-header">Admin</th>
              <th className="table-header">Plan</th>
              <th className="table-header">Suites</th>
              <th className="table-header">MRR</th>
              <th className="table-header">Vence</th>
              <th className="table-header">Estado</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="table-cell text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>
                {search ? 'No se encontraron empresas.' : 'No hay empresas registradas.'}
              </td></tr>
            ) : filtered.map(c => {
              const expires  = c.subscription_ends_at ?? ''
              const daysLeft = expires ? Math.ceil((new Date(expires).getTime() - Date.now()) / 86400000) : Infinity
              const isSoon   = daysLeft < 30 && daysLeft >= 0 && c.status === 'active'
              const suites   = c.active_suites ?? c.plan?.modules ?? []

              return (
                <tr key={c.id} className="table-row">
                  <td className="table-cell">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      c.status === 'suspended' ? 'bg-red-500/10' : isSoon ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                    }`}>
                      {c.status === 'suspended'
                        ? <ShieldOff size={15} className="text-red-400" />
                        : isSoon ? <AlertIcon size={15} className="text-amber-400" />
                        : <Building2 size={15} className="text-emerald-400" />}
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{c.name}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-3)' }}>{c.subdomain}.leymaken.com</p>
                  </td>
                  <td className="table-cell min-w-[180px]">
                    {c.admin_user ? (
                      <div className="flex items-center gap-1">
                        <p className="text-[11px] font-mono truncate max-w-[160px]" style={{ color: 'var(--text-2)' }}>{c.admin_user.email}</p>
                        <button onClick={() => navigator.clipboard.writeText(c.admin_user!.email)}
                          className="p-0.5 text-gray-600 hover:text-gray-300 flex-shrink-0" title="Copiar email">
                          <Copy size={10} />
                        </button>
                      </div>
                    ) : <span className="text-xs" style={{ color: 'var(--text-3)' }}>—</span>}
                  </td>
                  <td className="table-cell text-xs" style={{ color: 'var(--text-2)' }}>
                    {c.plan?.name ?? <span style={{ color: 'var(--text-3)' }}>—</span>}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1 flex-wrap max-w-[160px]">
                      {suites.length > 0
                        ? suites.map((s: string) => <Badge key={s} variant="blue">{s}</Badge>)
                        : <span className="text-xs" style={{ color: 'var(--text-3)' }}>—</span>}
                    </div>
                  </td>
                  <td className="table-cell font-mono text-sm text-emerald-400">
                    {getMRR(c) > 0 ? formatDOP(getMRR(c)) : '—'}
                  </td>
                  <td className="table-cell text-xs" style={{ color: isSoon ? '#f59e0b' : 'var(--text-3)' }}>
                    {expires || '—'}
                    {isSoon && <span className="block text-[10px] text-amber-400">{daysLeft}d restantes</span>}
                  </td>
                  <td className="table-cell">
                    <Badge variant={c.status === 'active' ? 'green' : 'red'}>
                      {c.status === 'active' ? 'Activa' : 'Suspendida'}
                    </Badge>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1 items-center">
                      <a href={`https://${c.subdomain}.leymaken.com`} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors" title="Abrir">
                        <ExternalLink size={14} />
                      </a>
                      {c.status === 'active'
                        ? <button onClick={() => handleToggle(c)}
                            className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Suspender">
                            <ShieldOff size={14} />
                          </button>
                        : <button onClick={() => handleToggle(c)}
                            className="p-1.5 rounded-md text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Activar">
                            <ShieldCheck size={14} />
                          </button>}

                      <div data-menu>
                        <button data-menu
                          onClick={(e) => {
                            e.stopPropagation()
                            if (menuFor === c.id) { setMenuFor(null); setMenuPos(null) }
                            else {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                              setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                              setMenuFor(c.id)
                            }
                          }}
                          className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors">
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Floating dropdown */}
      {menuFor !== null && menuPos && (
        <div data-menu
          className="fixed z-[200] w-52 rounded-lg border shadow-xl overflow-hidden"
          style={{ top: menuPos.top, right: menuPos.right, background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {(() => {
            const c = filtered.find(x => x.id === menuFor)
            if (!c) return null
            return (
              <>
                <button data-menu
                  onClick={() => { setMenuFor(null); setMenuPos(null); openReset(c) }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs hover:bg-gray-800 transition-colors"
                  style={{ color: 'var(--text-2)' }}>
                  <KeyRound size={13} /> Restablecer contraseña
                </button>
                <button data-menu
                  onClick={() => { setMenuFor(null); setMenuPos(null); setDeleteFor(c) }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={13} /> Eliminar empresa
                </button>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
