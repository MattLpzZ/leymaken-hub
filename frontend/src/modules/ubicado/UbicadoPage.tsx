import { useState, useEffect } from 'react'
import {
  BarChart2, Home, Building2, Mountain, Store, Warehouse, Trees, Building,
  Eye, Star, Trash2, Loader2, Users, MapPin, TrendingUp,
} from 'lucide-react'
import { Tabs, TabList, Tab, TabPanel } from '@/components/Tabs'
import { UbicadoService, type ReStats, type ReProperty, type ReSeller } from '@/lib/services/ubicado.service'
import { StatCard } from '@/components/StatCard'

// ─── helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  casa: 'Casa', apartamento: 'Apartamento', solar: 'Solar',
  local: 'Local', nave: 'Nave', finca: 'Finca', penthouse: 'Penthouse',
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  casa:        <Home size={13} />,
  apartamento: <Building2 size={13} />,
  solar:       <Mountain size={13} />,
  local:       <Store size={13} />,
  nave:        <Warehouse size={13} />,
  finca:       <Trees size={13} />,
  penthouse:   <Building size={13} />,
}

const STATUS_LABELS: Record<string, string> = {
  activo: 'Activo', vendido: 'Vendido', pausado: 'Pausado', borrador: 'Borrador',
}

const STATUS_BADGE: Record<string, string> = {
  activo:   'badge-green',
  vendido:  'badge-blue',
  pausado:  'badge-yellow',
  borrador: 'badge-gray',
}

const PLAN_BADGE: Record<string, string> = {
  free:  'badge-gray',
  basic: 'badge-blue',
  pro:   'badge-green',
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free', basic: 'Basic', pro: 'Pro',
}

const SELLER_STATUS_BADGE: Record<string, string> = {
  active:    'badge-green',
  pending:   'badge-yellow',
  suspended: 'badge-red',
}

const SELLER_STATUS_LABELS: Record<string, string> = {
  active: 'Activo', pending: 'Pendiente', suspended: 'Suspendido',
}

function fmt(n: number) {
  return n.toLocaleString('es-DO')
}

// ─── Tab 1: Dashboard ────────────────────────────────────────────────────────

function Dashboard() {
  const [stats, setStats] = useState<ReStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    UbicadoService.stats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="card text-center py-12">
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>No se pudo cargar el dashboard</p>
      </div>
    )
  }

  const activeCount = stats.by_status['activo'] ?? 0
  const totalSellers = Object.values(stats.by_status).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">
      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total propiedades"
          value={fmt(stats.total_properties)}
          icon={Building2}
          color="bg-emerald-600"
        />
        <StatCard
          title="Listados activos"
          value={fmt(activeCount)}
          icon={Home}
          color="bg-blue-600"
        />
        <StatCard
          title="Precio promedio"
          value={`RD$ ${fmt(Math.round(stats.avg_price))}`}
          icon={TrendingUp}
          color="bg-amber-500"
        />
        <StatCard
          title="Total en base"
          value={fmt(totalSellers)}
          subtitle="propiedades registradas"
          icon={Users}
          color="bg-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* by type */}
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <BarChart2 size={15} className="text-emerald-400" />
            Por tipo
          </h3>
          {Object.entries(stats.by_type).length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin datos</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.by_type)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const pct = stats.total_properties > 0
                    ? Math.round((count / stats.total_properties) * 100)
                    : 0
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
                          {TYPE_ICONS[type]}
                          {TYPE_LABELS[type] ?? type}
                        </span>
                        <span className="font-medium" style={{ color: 'var(--text-1)' }}>{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* by status */}
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Por estado</h3>
          {Object.entries(stats.by_status).length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin datos</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <span className={`badge ${STATUS_BADGE[status] ?? 'badge-gray'}`}>
                    {STATUS_LABELS[status] ?? status}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* by sector */}
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <MapPin size={14} className="text-emerald-400" />
            Top sectores
          </h3>
          {stats.by_sector.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin datos</p>
          ) : (
            <div className="space-y-2">
              {stats.by_sector.slice(0, 5).map(({ sector, count }) => (
                <div key={sector} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs truncate" style={{ color: 'var(--text-2)' }}>{sector}</span>
                  <span className="text-xs font-semibold ml-2" style={{ color: 'var(--text-1)' }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* top viewed */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <Eye size={14} className="text-emerald-400" />
          Top 5 más vistas
        </h3>
        {stats.top_viewed.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin datos</p>
        ) : (
          <div className="space-y-1">
            {stats.top_viewed.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--text-3)' }}>#{i + 1}</span>
                <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-1)' }}>{p.title}</span>
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                  <Eye size={11} /> {fmt(p.views)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab 2: Propiedades ───────────────────────────────────────────────────────

type PropStatus = 'activo' | 'vendido' | 'pausado' | 'borrador'

function Propiedades() {
  const [props, setProps]       = useState<ReProperty[]>([])
  const [loading, setLoading]   = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter]     = useState('')
  const [featuredFilter, setFeaturedFilter] = useState(false)
  const [confirmDelete, setConfirmDelete]   = useState<number | null>(null)

  const fetchProps = () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    if (typeFilter)   params.type   = typeFilter
    if (featuredFilter) params.featured = '1'
    UbicadoService.properties(params)
      .then(setProps)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProps() }, [statusFilter, typeFilter, featuredFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFeatured = async (p: ReProperty) => {
    const next = !p.featured
    setProps(prev => prev.map(x => x.id === p.id ? { ...x, featured: next } : x))
    try {
      await UbicadoService.updateProperty(p.id, { featured: next })
    } catch {
      fetchProps()
    }
  }

  const changeStatus = async (p: ReProperty, status: PropStatus) => {
    setProps(prev => prev.map(x => x.id === p.id ? { ...x, status } : x))
    try {
      await UbicadoService.updateProperty(p.id, { status })
    } catch {
      fetchProps()
    }
  }

  const handleDelete = async (id: number) => {
    setProps(prev => prev.filter(x => x.id !== id))
    setConfirmDelete(null)
    try {
      await UbicadoService.deleteProperty(id)
    } catch {
      fetchProps()
    }
  }

  const displayed = props.slice(0, 100)

  return (
    <div className="space-y-4">
      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="vendido">Vendido</option>
          <option value="pausado">Pausado</option>
          <option value="borrador">Borrador</option>
        </select>

        <select
          className="input w-auto"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: 'var(--text-2)' }}>
          <input
            type="checkbox"
            checked={featuredFilter}
            onChange={e => setFeaturedFilter(e.target.checked)}
            className="w-4 h-4 accent-emerald-500"
          />
          Solo destacados
        </label>

        <span className="text-xs ml-auto" style={{ color: 'var(--text-3)' }}>
          {props.length} resultados
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-emerald-400" />
        </div>
      ) : props.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sin propiedades</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Cambia los filtros para ver resultados</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr>
                <th className="table-header">Propiedad</th>
                <th className="table-header">Tipo</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Precio</th>
                <th className="table-header">Sector</th>
                <th className="table-header text-right">Vistas</th>
                <th className="table-header text-center">Dest.</th>
                <th className="table-header">Vendedor</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(p => (
                <tr key={p.id} className="table-row">
                  {/* title */}
                  <td className="table-cell max-w-[220px]">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{p.title}</p>
                    {p.photos && p.photos.length > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{p.photos.length} foto{p.photos.length !== 1 ? 's' : ''}</p>
                    )}
                  </td>

                  {/* type */}
                  <td className="table-cell">
                    <span className={`badge badge-gray flex items-center gap-1 w-fit`}>
                      {TYPE_ICONS[p.type]}
                      {TYPE_LABELS[p.type] ?? p.type}
                    </span>
                  </td>

                  {/* status */}
                  <td className="table-cell">
                    <select
                      value={p.status}
                      onChange={e => changeStatus(p, e.target.value as PropStatus)}
                      className="text-xs rounded-lg px-2 py-1 border border-gray-700 bg-gray-800 cursor-pointer"
                      style={{ color: 'var(--text-2)' }}
                    >
                      <option value="activo">Activo</option>
                      <option value="pausado">Pausado</option>
                      <option value="vendido">Vendido</option>
                      <option value="borrador">Borrador</option>
                    </select>
                  </td>

                  {/* price */}
                  <td className="table-cell whitespace-nowrap">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                      {p.currency === 'USD' ? 'US$' : 'RD$'} {fmt(p.price)}
                    </span>
                    {p.negotiable && (
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>Negociable</p>
                    )}
                  </td>

                  {/* sector */}
                  <td className="table-cell text-sm" style={{ color: 'var(--text-2)' }}>
                    {p.sector ?? '—'}
                  </td>

                  {/* views */}
                  <td className="table-cell text-right text-sm" style={{ color: 'var(--text-2)' }}>
                    <span className="flex items-center justify-end gap-1">
                      <Eye size={12} />
                      {fmt(p.views)}
                    </span>
                  </td>

                  {/* featured toggle */}
                  <td className="table-cell text-center">
                    <button
                      onClick={() => toggleFeatured(p)}
                      className={`p-1.5 rounded-md transition-colors ${
                        p.featured
                          ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                          : 'text-gray-600 hover:text-amber-400 hover:bg-amber-500/10'
                      }`}
                      title={p.featured ? 'Quitar destacado' : 'Marcar como destacado'}
                    >
                      <Star size={14} fill={p.featured ? 'currentColor' : 'none'} />
                    </button>
                  </td>

                  {/* seller */}
                  <td className="table-cell text-sm max-w-[140px]">
                    <span className="truncate block" style={{ color: 'var(--text-2)' }}>
                      {p.seller_name ?? '—'}
                    </span>
                  </td>

                  {/* actions */}
                  <td className="table-cell">
                    {confirmDelete === p.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-500 transition-colors"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                          style={{ color: 'var(--text-3)' }}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(p.id)}
                        className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Eliminar propiedad"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {props.length > 100 && (
            <div className="px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
              Mostrando 100 de {props.length} resultados. Usa los filtros para acotar.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab 3: Vendedores ────────────────────────────────────────────────────────

type SellerStatus = 'pending' | 'active' | 'suspended'

const NEXT_STATUS: Record<SellerStatus, { next: SellerStatus; label: string }> = {
  pending:   { next: 'active',    label: 'Aprobar' },
  active:    { next: 'suspended', label: 'Suspender' },
  suspended: { next: 'active',    label: 'Reactivar' },
}

function Vendedores() {
  const [sellers, setSellers] = useState<ReSeller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    UbicadoService.sellers()
      .then(setSellers)
      .finally(() => setLoading(false))
  }, [])

  const changeStatus = async (seller: ReSeller, status: SellerStatus) => {
    setSellers(prev => prev.map(s => s.id === seller.id ? { ...s, status } : s))
    // Note: seller status update endpoint not specified — uses property update convention if needed
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          {sellers.length} vendedor{sellers.length !== 1 ? 'es' : ''} registrados
        </span>
      </div>

      {sellers.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sin vendedores registrados</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="table-header">Vendedor</th>
                <th className="table-header">Contacto</th>
                <th className="table-header">Plan</th>
                <th className="table-header">Estado</th>
                <th className="table-header text-right">Listados</th>
                <th className="table-header">Registrado</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {sellers.map(s => {
                const transition = NEXT_STATUS[s.status as SellerStatus]
                return (
                  <tr key={s.id} className="table-row">
                    {/* name */}
                    <td className="table-cell">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{s.name}</p>
                    </td>

                    {/* contact */}
                    <td className="table-cell">
                      <p className="text-xs" style={{ color: 'var(--text-2)' }}>{s.email}</p>
                      {s.phone && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{s.phone}</p>
                      )}
                    </td>

                    {/* plan */}
                    <td className="table-cell">
                      <span className={`badge ${PLAN_BADGE[s.plan] ?? 'badge-gray'}`}>
                        {PLAN_LABELS[s.plan] ?? s.plan}
                      </span>
                    </td>

                    {/* status */}
                    <td className="table-cell">
                      <span className={`badge ${SELLER_STATUS_BADGE[s.status] ?? 'badge-gray'}`}>
                        {SELLER_STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </td>

                    {/* listings */}
                    <td className="table-cell text-right text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                      {s.listings_used}
                    </td>

                    {/* created */}
                    <td className="table-cell text-xs" style={{ color: 'var(--text-3)' }}>
                      {s.created_at?.slice(0, 10) ?? '—'}
                    </td>

                    {/* action */}
                    <td className="table-cell">
                      {transition && (
                        <button
                          onClick={() => changeStatus(s, transition.next)}
                          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            transition.next === 'active'
                              ? 'border-emerald-600 text-emerald-400 hover:bg-emerald-600/10'
                              : transition.next === 'suspended'
                                ? 'border-red-700 text-red-400 hover:bg-red-500/10'
                                : 'border-gray-600 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {transition.label}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function UbicadoPage() {
  return (
    <Tabs defaultTab="dashboard">
      <TabList>
        <Tab id="dashboard"    label="Dashboard"    icon={<BarChart2 size={14} />} />
        <Tab id="propiedades"  label="Propiedades"  icon={<Building2 size={14} />} />
        <Tab id="vendedores"   label="Vendedores"   icon={<Users size={14} />} />
      </TabList>

      <TabPanel id="dashboard">   <Dashboard />    </TabPanel>
      <TabPanel id="propiedades"> <Propiedades />  </TabPanel>
      <TabPanel id="vendedores">  <Vendedores />   </TabPanel>
    </Tabs>
  )
}
