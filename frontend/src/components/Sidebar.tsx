import { useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, Settings,
  Calendar, FolderKanban,
  Zap, Megaphone, LifeBuoy, Wallet, TrendingUp,
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
      { label: 'Suite',          icon: Layers,      href: '/suite' },
      { label: 'Ubicado',        icon: MapPin,      href: '/ubicado' },
      { label: 'Automatización', icon: Zap,         href: '/automation' },
      { label: 'Proyectos',      icon: FolderKanban,href: '/projects' },
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
      { label: 'Infraestructura', icon: Server,   href: '/infra' },
      { label: 'CMM',             icon: Megaphone,href: '/cmm' },
      { label: 'Soporte',         icon: LifeBuoy, href: '/support' },
    ],
  },
  {
    label: '',
    items: [
      { label: 'Configuración', icon: Settings, href: '/settings' },
    ],
  },
]

export function Sidebar() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      style={{ width: collapsed ? 64 : 220, background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      className="h-screen flex flex-col flex-shrink-0 transition-all duration-200"
    >
      <div className="h-16 flex items-center px-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        {!collapsed && (
          <span className="font-bold text-sm tracking-widest" style={{ color: 'var(--accent)' }}>
            LEYMAKEN HUB
          </span>
        )}
        <button
          className="ml-auto p-1 rounded hover:bg-gray-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          <LayoutDashboard size={16} style={{ color: 'var(--text-2)' }} />
        </button>
      </div>

      <nav className="flex-1 px-2 py-2 overflow-y-auto flex flex-col">
        <div className="flex-1 space-y-0">
          {sections.map(({ label, items }) => (
            <div key={label || '_bottom'}>
              {!collapsed && label && (
                <span
                  className="block text-[9px] font-semibold tracking-widest px-3 pt-4 pb-1"
                  style={{ color: 'var(--text-3)' }}
                >
                  {label}
                </span>
              )}
              {collapsed && label && <div className="pt-2" />}
              <div className="space-y-0.5">
                {items.map(({ label: itemLabel, icon: Icon, href }) => {
                  const active = pathname === href
                  return (
                    <Link
                      key={href}
                      to={href}
                      className="flex items-center gap-3 px-3 py-2 rounded text-sm transition-all duration-150"
                      style={{
                        color: active ? 'var(--accent)' : 'var(--text-2)',
                        background: active ? '#10b98115' : 'transparent',
                        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                      }}
                    >
                      <Icon size={15} />
                      {!collapsed && itemLabel}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  )
}
