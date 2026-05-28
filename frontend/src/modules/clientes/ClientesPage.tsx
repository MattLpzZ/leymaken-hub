import { useEffect, useState } from 'react'
import { Edit2, Trash2, ChevronRight, X, Plus, Loader2 } from 'lucide-react'
import { ClientsService } from '@/lib/services/clients.service'
import type { Client, ClientService } from '@/lib/services/clients.service'

const SERVICE_COLOR: Record<string, string> = {
  suite:      'bg-emerald-500/15 text-emerald-400',
  automation: 'bg-violet-500/15 text-violet-400',
  project:    'bg-sky-500/15 text-sky-400',
  ubicado:    'bg-amber-500/15 text-amber-400',
}
const SERVICE_LABEL: Record<string, string> = {
  suite: 'Suite', automation: 'Auto', project: 'Proyecto', ubicado: 'Ubicado',
}

function ServicePill({ type }: { type: string }) {
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${SERVICE_COLOR[type] ?? 'bg-gray-700 text-gray-400'}`}>
      {SERVICE_LABEL[type] ?? type}
    </span>
  )
}

const STATUS_BADGE: Record<string, string> = {
  active:   'badge badge-green',
  prospect: 'badge badge-yellow',
  inactive: 'badge badge-gray',
}
const STATUS_LABEL: Record<string, string> = {
  active:   'Activo',
  prospect: 'Prospecto',
  inactive: 'Inactivo',
}

const SVC_STATUS_BADGE: Record<string, string> = {
  active:    'badge badge-green',
  pending:   'badge badge-yellow',
  paused:    'badge badge-gray',
  cancelled: 'badge badge-red',
}
const SVC_STATUS_LABEL: Record<string, string> = {
  active:    'Activo',
  pending:   'Pendiente',
  paused:    'Pausado',
  cancelled: 'Cancelado',
}

const ICON_BG: Record<string, string> = {
  active:   'bg-emerald-500/20 text-emerald-400',
  prospect: 'bg-amber-500/20 text-amber-400',
  inactive: 'bg-gray-500/20 text-gray-400',
}

function formatMrr(mrr: number): string {
  return mrr > 0 ? `RD$ ${mrr.toLocaleString()}` : '—'
}

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  company_name: '',
  rnc: '',
  address: '',
  notes: '',
  status: 'prospect' as Client['status'],
}

const EMPTY_SVC_FORM = {
  type: 'suite' as ClientService['type'],
  name: '',
  status: 'pending' as ClientService['status'],
  monthly_value: 0,
  start_date: '',
  notes: '',
}

export function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'prospect' | 'active' | 'inactive'>('all')
  const [selected, setSelected] = useState<Client | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Client | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [serviceForm, setServiceForm] = useState({ ...EMPTY_SVC_FORM })

  useEffect(() => {
    ClientsService.list().then(setClients).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? clients : clients.filter(c => c.status === filter)

  const counts = {
    prospect: clients.filter(c => c.status === 'prospect').length,
    active:   clients.filter(c => c.status === 'active').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
  }
  const totalMrr = clients.reduce((sum, c) => sum + (c.mrr ?? 0), 0)

  function openCreate() {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  function openEdit(c: Client) {
    setEditTarget(c)
    setForm({
      name:         c.name,
      email:        c.email ?? '',
      phone:        c.phone ?? '',
      company_name: c.company_name ?? '',
      rnc:          c.rnc ?? '',
      address:      c.address ?? '',
      notes:        c.notes ?? '',
      status:       c.status,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editTarget) {
        const updated = await ClientsService.update(editTarget.id, form)
        setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
        if (selected?.id === updated.id) setSelected(updated)
      } else {
        const created = await ClientsService.create(form)
        setClients(prev => [...prev, created])
      }
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(c: Client) {
    await ClientsService.remove(c.id)
    setClients(prev => prev.filter(x => x.id !== c.id))
    if (selected?.id === c.id) setSelected(null)
  }

  async function handleAddService() {
    if (!selected || !serviceForm.name.trim()) return
    setSaving(true)
    try {
      const svc = await ClientsService.addService(selected.id, serviceForm)
      const updatedSelected = { ...selected, services: [...selected.services, svc] }
      setSelected(updatedSelected)
      setClients(prev => prev.map(c => c.id === selected.id ? updatedSelected : c))
      setShowServiceForm(false)
      setServiceForm({ ...EMPTY_SVC_FORM })
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveService(svcId: number) {
    if (!selected) return
    await ClientsService.removeService(selected.id, svcId)
    const updatedSelected = { ...selected, services: selected.services.filter(s => s.id !== svcId) }
    setSelected(updatedSelected)
    setClients(prev => prev.map(c => c.id === selected.id ? updatedSelected : c))
  }

  return (
    <div className="p-6 space-y-5 page-enter">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-1)' }}>Clientes</h1>
          <span className="badge badge-yellow">{counts.prospect} prospectos</span>
          <span className="badge badge-green">{counts.active} activos</span>
          <span className="font-mono text-sm text-emerald-400">{formatMrr(totalMrr)} MRR</span>
        </div>
        <button className="btn-primary flex items-center gap-1.5" onClick={openCreate}>
          <Plus size={15} />
          Nuevo cliente
        </button>
      </div>

      <div className="flex gap-1">
        {(['all', 'prospect', 'active', 'inactive'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'prospect' ? 'Prospectos' : f === 'active' ? 'Activos' : 'Inactivos'}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-emerald-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center" style={{ color: 'var(--text-3)' }}>
            No hay clientes
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-8"></th>
                <th className="table-header">Nombre / Empresa</th>
                <th className="table-header">Servicios</th>
                <th className="table-header">MRR</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="table-cell">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${ICON_BG[c.status] ?? 'bg-gray-700 text-gray-400'}`}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="font-medium text-sm" style={{ color: 'var(--text-1)' }}>{c.name}</div>
                    {c.company_name && (
                      <div className="text-[11px] text-gray-500">{c.company_name}</div>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.services.map(s => (
                        <ServicePill key={s.id} type={s.type} />
                      ))}
                      {c.services.length === 0 && (
                        <span className="text-[11px] text-gray-600">—</span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell font-mono text-sm text-emerald-400">
                    {formatMrr(c.mrr)}
                  </td>
                  <td className="table-cell">
                    <span className={STATUS_BADGE[c.status] ?? 'badge badge-gray'}>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                        onClick={() => openEdit(c)}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
                        onClick={() => handleDelete(c)}
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                        onClick={() => setSelected(c)}
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40"
            onClick={() => setSelected(null)}
          />
          <div
            className="fixed top-0 right-0 h-screen z-40 flex flex-col"
            style={{ width: 360, background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{selected.name}</div>
                {selected.company_name && (
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{selected.company_name}</div>
                )}
                <span className={`mt-1.5 inline-block ${STATUS_BADGE[selected.status] ?? 'badge badge-gray'}`}>
                  {STATUS_LABEL[selected.status] ?? selected.status}
                </span>
              </div>
              <button
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                onClick={() => setSelected(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                {selected.email && (
                  <div className="flex gap-2 text-sm">
                    <span style={{ color: 'var(--text-3)' }} className="w-16 shrink-0">Email</span>
                    <span style={{ color: 'var(--text-2)' }}>{selected.email}</span>
                  </div>
                )}
                {selected.phone && (
                  <div className="flex gap-2 text-sm">
                    <span style={{ color: 'var(--text-3)' }} className="w-16 shrink-0">Teléfono</span>
                    <span style={{ color: 'var(--text-2)' }}>{selected.phone}</span>
                  </div>
                )}
                {selected.rnc && (
                  <div className="flex gap-2 text-sm">
                    <span style={{ color: 'var(--text-3)' }} className="w-16 shrink-0">RNC</span>
                    <span style={{ color: 'var(--text-2)' }}>{selected.rnc}</span>
                  </div>
                )}
                {selected.address && (
                  <div className="flex gap-2 text-sm">
                    <span style={{ color: 'var(--text-3)' }} className="w-16 shrink-0">Dirección</span>
                    <span style={{ color: 'var(--text-2)' }}>{selected.address}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-3)' }}>
                  Servicios asignados
                </div>
                <div className="space-y-2">
                  {selected.services.map(s => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-md px-3 py-2"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ServicePill type={s.type} />
                        <span className="text-xs truncate" style={{ color: 'var(--text-1)' }}>{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {s.monthly_value > 0 && (
                          <span className="font-mono text-[11px] text-emerald-400">
                            {formatMrr(s.monthly_value)}
                          </span>
                        )}
                        <span className={SVC_STATUS_BADGE[s.status] ?? 'badge badge-gray'} style={{ fontSize: 10 }}>
                          {SVC_STATUS_LABEL[s.status] ?? s.status}
                        </span>
                        <button
                          className="p-0.5 rounded hover:bg-red-900/30 text-gray-600 hover:text-red-400 transition-colors"
                          onClick={() => handleRemoveService(s.id)}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {selected.services.length === 0 && (
                    <div className="text-xs py-2" style={{ color: 'var(--text-3)' }}>Sin servicios asignados</div>
                  )}
                </div>
                <button
                  className="btn-secondary w-full mt-3 flex items-center justify-center gap-1.5 text-xs"
                  onClick={() => { setShowServiceForm(true); setServiceForm({ ...EMPTY_SVC_FORM }) }}
                >
                  <Plus size={13} />
                  Agregar servicio
                </button>
              </div>
            </div>

            <div
              className="p-4 flex items-center justify-between"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>MRR total</span>
              <span className="font-mono text-sm text-emerald-400 font-semibold">
                {formatMrr(selected.services.filter(s => s.status === 'active').reduce((sum, s) => sum + s.monthly_value, 0))}
              </span>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>
                {editTarget ? 'Editar cliente' : 'Nuevo cliente'}
              </h2>
              <button
                className="p-1 rounded hover:bg-gray-700 text-gray-400 transition-colors"
                onClick={() => setShowForm(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Nombre</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Email</label>
                  <input
                    className="input"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="809-000-0000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Empresa</label>
                  <input
                    className="input"
                    value={form.company_name}
                    onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                    placeholder="Nombre de empresa"
                  />
                </div>
                <div>
                  <label className="label">RNC</label>
                  <input
                    className="input"
                    value={form.rnc}
                    onChange={e => setForm(f => ({ ...f, rnc: e.target.value }))}
                    placeholder="1-31-12345-6"
                  />
                </div>
              </div>
              <div>
                <label className="label">Estado</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as Client['status'] }))}
                >
                  <option value="prospect">Prospecto</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="label">Dirección</label>
                <input
                  className="input"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Dirección"
                />
              </div>
              <div>
                <label className="label">Notas</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
            <div
              className="flex justify-end gap-2 p-5"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <button className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button className="btn-primary flex items-center gap-1.5" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 size={13} className="animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showServiceForm && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Agregar servicio</h2>
              <button
                className="p-1 rounded hover:bg-gray-700 text-gray-400 transition-colors"
                onClick={() => setShowServiceForm(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Tipo</label>
                <select
                  className="input"
                  value={serviceForm.type}
                  onChange={e => setServiceForm(f => ({ ...f, type: e.target.value as ClientService['type'] }))}
                >
                  <option value="suite">Suite</option>
                  <option value="automation">Automatización</option>
                  <option value="project">Proyecto</option>
                  <option value="ubicado">Ubicado</option>
                </select>
              </div>
              <div>
                <label className="label">Nombre</label>
                <input
                  className="input"
                  value={serviceForm.name}
                  onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="ERP Commerce, Bot WhatsApp, Web Corporativa..."
                />
              </div>
              <div>
                <label className="label">Estado</label>
                <select
                  className="input"
                  value={serviceForm.status}
                  onChange={e => setServiceForm(f => ({ ...f, status: e.target.value as ClientService['status'] }))}
                >
                  <option value="pending">Pendiente</option>
                  <option value="active">Activo</option>
                  <option value="paused">Pausado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="label">Valor mensual (RD$)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={serviceForm.monthly_value}
                  onChange={e => setServiceForm(f => ({ ...f, monthly_value: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label">Fecha de inicio</label>
                <input
                  className="input"
                  type="date"
                  value={serviceForm.start_date}
                  onChange={e => setServiceForm(f => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Notas</label>
                <textarea
                  className="input"
                  rows={2}
                  value={serviceForm.notes}
                  onChange={e => setServiceForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Opcional..."
                />
              </div>
            </div>
            <div
              className="flex justify-end gap-2 p-5"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <button className="btn-secondary" onClick={() => setShowServiceForm(false)}>
                Cancelar
              </button>
              <button className="btn-primary flex items-center gap-1.5" onClick={handleAddService} disabled={saving}>
                {saving && <Loader2 size={13} className="animate-spin" />}
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
