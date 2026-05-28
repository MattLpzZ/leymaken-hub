import { useState, useRef, useEffect } from 'react'
import { HelpCircle, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { useLocation } from 'react-router-dom'

type Status = 'activo' | 'parcial' | 'pendiente'

interface ModuleInfo {
  name: string
  description: string
  status: Status
  notes?: string
}

const MODULE_MAP: Record<string, ModuleInfo> = {
  '/': {
    name: 'Control Hub',
    description: 'Vista general del negocio. KPIs de clientes, MRR, facturación y accesos directos a todos los módulos.',
    status: 'activo',
  },
  '/clientes': {
    name: 'Clientes',
    description: 'Registro y gestión unificada de clientes. Asigna servicios (Suite, Automatización, Proyectos), crea cotizaciones y mantiene el historial completo.',
    status: 'parcial',
    notes: 'El modelo de asignación de servicios por cliente está en desarrollo.',
  },
  '/suite': {
    name: 'Suite',
    description: 'Gestión de subscripciones SaaS de Leymaken. Empresas clientes, planes, API keys y suites activas asignadas.',
    status: 'activo',
  },
  '/ubicado': {
    name: 'Ubicado',
    description: 'Plataforma inmobiliaria nacional. Gestión de propiedades, vendedores y estadísticas del marketplace.',
    status: 'activo',
    notes: 'Conectado a soymatt-platform vía API.',
  },
  '/automation': {
    name: 'Automatización',
    description: 'Flujos n8n, agentes de IA y bots de WhatsApp. Gestión de workflows activos, colas y agentes por cliente.',
    status: 'parcial',
    notes: 'Conexión con n8n en desarrollo.',
  },
  '/projects': {
    name: 'Proyectos',
    description: 'Desarrollo a la medida. Seguimiento de proyectos, hitos, entregas y estado por cliente.',
    status: 'pendiente',
  },
  '/billing': {
    name: 'Facturación',
    description: 'Facturas, cotizaciones y recibos generados según los servicios asignados a cada cliente.',
    status: 'parcial',
    notes: 'La generación automática por servicios asignados está en desarrollo.',
  },
  '/caja': {
    name: 'Caja',
    description: 'Registro de cobros y pagos en efectivo o transferencia. Control de flujo de caja diario.',
    status: 'pendiente',
  },
  '/finance': {
    name: 'Finanzas',
    description: 'Vista financiera consolidada. MRR, ingresos, gastos y proyecciones del negocio.',
    status: 'pendiente',
  },
  '/infra': {
    name: 'Infraestructura',
    description: 'Estado en tiempo real de Docker, VPS, GitHub y Cloudflare. Panel DevOps para operaciones técnicas.',
    status: 'activo',
  },
  '/agenda': {
    name: 'Agenda',
    description: 'Calendario de citas, reuniones y tareas organizadas por cliente y proyecto.',
    status: 'pendiente',
  },
  '/settings': {
    name: 'Configuración',
    description: 'Empresa, usuarios, conexiones de sistema (n8n, Telegram, SMTP), apariencia y seguridad.',
    status: 'activo',
  },
}

const statusConfig = {
  activo:    { label: 'Activo',       color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  parcial:   { label: 'En desarrollo',color: 'text-amber-400',   bg: 'bg-amber-500/10',   icon: Clock },
  pendiente: { label: 'Pendiente',    color: 'text-gray-400',    bg: 'bg-gray-500/10',    icon: AlertCircle },
}

export function ModuleHelpButton() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const info = MODULE_MAP[pathname] ?? null

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  if (!info) return null

  const st = statusConfig[info.status]
  const StIcon = st.icon

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded transition-colors hover:bg-gray-800"
        title="¿Qué hace este módulo?"
        style={{ color: open ? 'var(--accent)' : 'var(--text-3)' }}
      >
        <HelpCircle size={15} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-xl z-50 p-4 space-y-3"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{info.name}</p>
            <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${st.color} ${st.bg}`}>
              <StIcon size={10} />
              {st.label}
            </span>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
            {info.description}
          </p>

          {info.notes && (
            <p className="text-[11px] px-3 py-2 rounded-lg" style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>
              {info.notes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
