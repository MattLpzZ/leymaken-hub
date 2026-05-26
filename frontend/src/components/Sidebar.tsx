import { useLocation, Link } from 'react-router-dom'
import { LayoutDashboard, Bot, Users, FileText, Settings } from 'lucide-react'
import { useState } from 'react'

const nav = [
  { label: 'Mission Control', icon: LayoutDashboard, href: '/' },
  { label: 'Agente',          icon: Bot,              href: '/agent' },
  { label: 'CRM',             icon: Users,            href: '/crm' },
  { label: 'Facturación',     icon: FileText,         href: '/billing' },
  { label: 'Configuración',   icon: Settings,         href: '/settings' },
]

export function Sidebar() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      style={{ width: collapsed ? 64 : 240, background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      className="h-screen flex flex-col flex-shrink-0 transition-all duration-200"
    >
      <div className="h-16 flex items-center px-4 border-b" style={{ borderColor: 'var(--border)' }}>
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

      <nav className="flex-1 p-2 space-y-1">
        {nav.map(({ label, icon: Icon, href }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              to={href}
              className="flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors"
              style={{
                color: active ? 'var(--accent)' : 'var(--text-2)',
                background: active ? '#10b98115' : 'transparent',
              }}
            >
              <Icon size={16} />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
