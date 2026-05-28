import { useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText,
  Calendar, FolderKanban,
  Zap, Wallet, TrendingUp,
  Layers, MapPin, Server,
} from 'lucide-react'
import { useState } from 'react'

const sections = [
  {
    label: 'HUB',
    items: [
      { label: 'Control Hub',  icon: LayoutDashboard, href: '/' },
      { label: 'Clientes',     icon: Users,           href: '/clientes' },
      { label: 'Agenda',       icon: Calendar,        href: '/agenda' },
    ],
  },
  {
    label: 'NEGOCIOS',
    items: [
      { label: 'Suite',           icon: Layers,       href: '/suite' },
      { label: 'Ubicado',         icon: MapPin,       href: '/ubicado' },
      { label: 'Automatización',  icon: Zap,          href: '/automation' },
      { label: 'Proyectos',       icon: FolderKanban, href: '/projects' },
    ],
  },
  {
    label: 'FINANZAS',
    items: [
      { label: 'Facturación', icon: FileText,   href: '/billing' },
      { label: 'Caja',        icon: Wallet,     href: '/caja' },
      { label: 'Finanzas',    icon: TrendingUp, href: '/finance' },
    ],
  },
  {
    label: 'OPS',
    items: [
      { label: 'Infraestructura', icon: Server, href: '/infra' },
    ],
  },
]

export function Sidebar() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      style={{ width: collapsed ? 56 : 232, background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      className="h-screen flex flex-col flex-shrink-0 transition-all duration-200"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        {!collapsed && (
          <span className="font-bold text-xs tracking-widest truncate" style={{ color: 'var(--accent)' }}>
            LEYMAKEN HUB
          </span>
        )}
        <button
          className="ml-auto p-1.5 rounded-md hover:bg-gray-800 flex-shrink-0"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <LayoutDashboard size={14} style={{ color: 'var(--text-3)' }} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5">
        {sections.map(({ label, items }) => (
          <div key={label}>
            {!collapsed && (
              <span
                className="block text-[9px] font-semibold tracking-widest px-2 pt-4 pb-1"
                style={{ color: 'var(--text-3)' }}
              >
                {label}
              </span>
            )}
            {collapsed && <div className="pt-2" />}

            <div className="space-y-0.5">
              {items.map(({ label: itemLabel, icon: Icon, href }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    to={href}
                    title={collapsed ? itemLabel : undefined}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-150 overflow-hidden"
                    style={{
                      color:      active ? 'var(--accent)'  : 'var(--text-2)',
                      background: active ? '#10b98118'      : 'transparent',
                      borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                    }}
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    {!collapsed && (
                      <span className="truncate">{itemLabel}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
