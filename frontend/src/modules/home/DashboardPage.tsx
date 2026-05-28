import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardService, type DashboardStats } from '@/lib/services/dashboard.service'
import {
  Users, DollarSign, Layers, Code2, Zap,
  ArrowRight, Activity, FileText,
  Wallet, MessageSquare, CalendarDays,
  MapPin, CheckCircle2, Kanban,
  TrendingUp, Server,
} from 'lucide-react'

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function today() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency', currency: 'DOP', maximumFractionDigits: 0,
  }).format(n)
}

function StatCard({
  label, value, sub, icon: Icon, color, onClick,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  color: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`card py-4 px-4 flex items-start gap-3 ${onClick ? 'cursor-pointer hover:border-gray-700 transition-all' : ''}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight" style={{ color: 'var(--text-1)' }}>{value}</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{label}</p>
        {sub && <p className="text-[10px] mt-0.5 text-emerald-400">{sub}</p>}
      </div>
    </div>
  )
}

function ServiceBlock({
  icon: Icon,
  label,
  color,
  iconColor,
  metric,
  metricLabel,
  links,
}: {
  icon: React.ElementType
  label: string
  color: string
  iconColor: string
  metric?: string | number
  metricLabel?: string
  links: { label: string; href: string; icon: React.ElementType }[]
}) {
  const navigate = useNavigate()

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={15} className={iconColor} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{label}</p>
        </div>
        {metric !== undefined && (
          <div className="text-right">
            <p className="text-base font-bold" style={{ color: 'var(--text-1)' }}>{metric}</p>
            {metricLabel && <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{metricLabel}</p>}
          </div>
        )}
      </div>
      <div className="space-y-1">
        {links.map(({ label, href, icon: LIcon }) => (
          <button
            key={href + label}
            onClick={() => navigate(href)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors hover:bg-gray-800/60 text-left"
            style={{ color: 'var(--text-2)' }}
          >
            <LIcon size={12} className="flex-shrink-0" style={{ color: 'var(--text-3)' }} />
            <span className="flex-1">{label}</span>
            <ArrowRight size={11} className="text-gray-700" />
          </button>
        ))}
      </div>
    </div>
  )
}

function AlertBanner({ count, label, onClick }: { count: number; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full card-sm flex items-center justify-between gap-3 hover:border-amber-500/30 transition-colors text-left"
    >
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
        <p className="text-sm" style={{ color: 'var(--text-1)' }}>
          <span className="font-semibold text-amber-400">{count}</span> {label}
        </p>
      </div>
      <ArrowRight size={14} className="text-gray-600 flex-shrink-0" />
    </button>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    DashboardService.stats().then(setStats).catch(() => {})
  }, [])

  const s = stats

  return (
    <div className="space-y-6 max-w-5xl">

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
            {greeting()}, Matt
          </h1>
          <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-3)' }}>{today()}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>
          <Activity size={11} className="text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">VPS online</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Clientes activos"
          value={s ? String(s.agency_clients) : '—'}
          icon={Users}
          color="bg-emerald-600"
          onClick={() => navigate('/clientes')}
        />
        <StatCard
          label="MRR mensual"
          value={s ? fmt(s.mrr) : '—'}
          sub={s && s.agency_clients > 0 ? `${s.agency_clients} cliente${s.agency_clients !== 1 ? 's' : ''}` : undefined}
          icon={TrendingUp}
          color="bg-emerald-700"
          onClick={() => navigate('/clientes')}
        />
        <StatCard
          label="Facturado este mes"
          value={s ? fmt(s.invoiced_month) : '—'}
          icon={DollarSign}
          color="bg-sky-700"
          onClick={() => navigate('/billing')}
        />
        <StatCard
          label="Infraestructura"
          value="VPS"
          sub="online"
          icon={Server}
          color="bg-gray-700"
          onClick={() => navigate('/infra')}
        />
      </div>

      {s && s.pending_queue > 0 && (
        <AlertBanner
          count={s.pending_queue}
          label="publicaciones esperando aprobación en cola de automatización"
          onClick={() => navigate('/automation')}
        />
      )}
      {s && s.pending_posts > 0 && (
        <AlertBanner
          count={s.pending_posts}
          label={`post${s.pending_posts !== 1 ? 's' : ''} en borrador con fecha programada en CMM`}
          onClick={() => navigate('/cmm')}
        />
      )}

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
          Negocios
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          <ServiceBlock
            icon={Layers}
            label="Suite"
            color="bg-emerald-500/15"
            iconColor="text-emerald-400"
            metricLabel="SaaS subscriptions"
            links={[
              { label: 'Subscripciones',    href: '/suite', icon: Layers },
              { label: 'Planes',            href: '/suite', icon: FileText },
            ]}
          />

          <ServiceBlock
            icon={MapPin}
            label="Ubicado"
            color="bg-amber-500/15"
            iconColor="text-amber-400"
            metricLabel="plataforma inmobiliaria"
            links={[
              { label: 'Propiedades',  href: '/ubicado', icon: MapPin },
              { label: 'Vendedores',   href: '/ubicado', icon: Users },
            ]}
          />

          <ServiceBlock
            icon={Zap}
            label="Automatización"
            color="bg-violet-500/15"
            iconColor="text-violet-400"
            metric={s ? s.agents_active : '—'}
            metricLabel="agentes activos"
            links={[
              { label: 'Flujos n8n',         href: '/automation', icon: Zap   },
              { label: 'Agentes WhatsApp',   href: '/automation', icon: MessageSquare },
            ]}
          />

          <ServiceBlock
            icon={Code2}
            label="Proyectos"
            color="bg-sky-500/15"
            iconColor="text-sky-400"
            metricLabel="desarrollo a la medida"
            links={[
              { label: 'Proyectos activos', href: '/projects', icon: Code2 },
              { label: 'Calendario',        href: '/agenda',   icon: CalendarDays },
            ]}
          />

        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
          Accesos rápidos
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { href: '/clientes', label: 'Pipeline',         icon: Kanban        },
            { href: '/clientes', label: 'Clientes activos', icon: CheckCircle2  },
            { href: '/support',  label: 'Soporte',          icon: MessageSquare },
            { href: '/caja',     label: 'Caja',             icon: Wallet        },
            { href: '/billing',  label: 'Facturación',      icon: FileText      },
            { href: '/agenda',   label: 'Agenda',           icon: CalendarDays  },
            { href: '/finance',  label: 'Finanzas',         icon: DollarSign    },
            { href: '/infra',    label: 'Infraestructura',  icon: Server        },
          ].map(({ href, label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => navigate(href)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-colors hover:bg-gray-800/60 text-left"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-2)' }}
            >
              <Icon size={13} style={{ color: 'var(--text-3)' }} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
