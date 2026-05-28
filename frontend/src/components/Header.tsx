import { useState, useRef } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useAiStore } from '@/stores/aiStore'

const NAV_ITEMS = [
  { label: 'Mission Control', href: '/' },
  { label: 'Dashboard',       href: '/dashboard' },
  { label: 'CRM',             href: '/crm' },
  { label: 'Facturación',     href: '/billing' },
  { label: 'Proyectos',       href: '/projects' },
  { label: 'Agenda',          href: '/agenda' },
  { label: 'Suite',           href: '/suite' },
  { label: 'Ubicado',         href: '/ubicado' },
  { label: 'Automatización',  href: '/automation' },
  { label: 'CMM',             href: '/cmm' },
  { label: 'Soporte',         href: '/support' },
  { label: 'Caja',            href: '/caja' },
  { label: 'Finanzas',        href: '/finance' },
  { label: 'Desktop',         href: '/desktop' },
  { label: 'Herramientas',    href: '/tools' },
  { label: 'Configuración',   href: '/settings' },
]

export function Header() {
  const { user, logout } = useAuthStore()
  const { open: aiOpen, toggle } = useAiStore()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = query.trim()
    ? NAV_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : []

  function handleSelect(href: string) {
    setQuery('')
    setShowDropdown(false)
    navigate(href)
  }

  function handleBlur() {
    setTimeout(() => setShowDropdown(false), 150)
  }

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b flex-shrink-0"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Left */}
      <span style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
        hub.leymaken.com
      </span>

      {/* Center — search */}
      <div className="relative" style={{ width: 200 }}>
        <div className="relative flex items-center">
          <Search
            size={13}
            className="absolute left-2.5 pointer-events-none"
            style={{ color: 'var(--text-3)' }}
          />
          <input
            ref={inputRef}
            type="text"
            className="input text-xs w-full"
            style={{
              paddingLeft: '1.75rem',
              background: '#111827',
              borderColor: '#1f2937',
            }}
            placeholder="Buscar módulo..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={handleBlur}
          />
        </div>
        {showDropdown && results.length > 0 && (
          <div
            className="absolute top-full left-0 mt-1 w-full rounded-lg overflow-hidden z-50"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            {results.map((item) => (
              <button
                key={item.href}
                className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-gray-800 flex items-center justify-between"
                style={{ color: 'var(--text-1)' }}
                onMouseDown={() => handleSelect(item.href)}
              >
                <span>{item.label}</span>
                <span style={{ color: 'var(--text-3)' }}>{item.href}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button
          className="p-1.5 rounded transition-colors hover:bg-gray-800"
          onClick={toggle}
          title="Asistente IA"
        >
          <Sparkles
            size={16}
            style={{ color: aiOpen ? '#10b981' : 'var(--text-3)' }}
          />
        </button>
        <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>|</span>
        <span style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>{user?.name}</span>
        <button className="btn-secondary text-xs" onClick={logout}>Salir</button>
      </div>
    </header>
  )
}
