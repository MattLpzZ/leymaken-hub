import { useEffect, useState } from 'react'
import { ExternalLink, GitBranch, RefreshCw, Globe } from 'lucide-react'

interface Project {
  name: string
  url: string
  admin?: string
  desc: string
  status: 'online' | 'offline' | 'checking'
}

const BASE_PROJECTS: Omit<Project, 'status'>[] = [
  { name: 'soymattlpzz.com',   url: 'https://soymattlpzz.com',  desc: 'Landing page & portafolio personal' },
  { name: 'dominicantodo.com', url: 'https://dominicantodo.com', admin: 'https://dominicantodo.com/wp-admin', desc: 'Plataforma de turismo dominicano' },
  { name: 'leymaken.com',      url: 'https://leymaken.com',      desc: 'ScriptNow ERP Suite — SaaS' },
]

async function ping(url: string): Promise<'online' | 'offline'> {
  try {
    const ctrl    = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 5000)
    await fetch(url, { method: 'HEAD', signal: ctrl.signal, mode: 'no-cors' })
    clearTimeout(timeout)
    return 'online'
  } catch {
    return 'offline'
  }
}

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>(
    BASE_PROJECTS.map(p => ({ ...p, status: 'checking' }))
  )
  const [checking, setChecking] = useState(false)

  async function checkAll() {
    setChecking(true)
    setProjects(p => p.map(x => ({ ...x, status: 'checking' })))
    const results = await Promise.all(BASE_PROJECTS.map(p => ping(p.url)))
    setProjects(BASE_PROJECTS.map((p, i) => ({ ...p, status: results[i] })))
    setChecking(false)
  }

  useEffect(() => { checkAll() }, [])

  const online = projects.filter(p => p.status === 'online').length

  const statusDot = (s: Project['status']) =>
    s === 'checking' ? 'bg-amber-400 animate-pulse'
    : s === 'online' ? 'bg-emerald-400'
    : 'bg-red-400'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>Portfolio & Marca</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>soymattlpzz — proyectos públicos</p>
        </div>
        <button onClick={checkAll} disabled={checking} className="btn-secondary text-xs py-1.5 flex items-center gap-1.5">
          <RefreshCw size={12} className={checking ? 'animate-spin' : ''} /> Verificar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Online',      value: online,            color: 'text-emerald-400' },
          { label: 'Proyectos',   value: projects.length,   color: '' },
          { label: 'Plataformas', value: 3,                 color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="card-sm text-center">
            <p className={`text-2xl font-bold ${s.color}`} style={!s.color ? { color: 'var(--text-1)' } : {}}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {projects.map(p => (
          <div key={p.name} className="card p-4 flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot(p.status)}`} />
            <Globe size={14} className="text-gray-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{p.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{p.desc}</p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <a href={p.url} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded-md border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors" title="Abrir sitio">
                <ExternalLink size={13} />
              </a>
              {p.admin && (
                <a href={p.admin} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-md border border-gray-700 text-gray-400 hover:text-sky-400 hover:border-sky-500/30 transition-colors" title="WP Admin">
                  <Globe size={13} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>Marca</p>
        <div className="flex flex-wrap gap-2">
          <a href="https://github.com/MattLpzZ" target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-xs py-1.5 flex items-center gap-1.5">
            <GitBranch size={12} /> GitHub
          </a>
          <a href="https://soymattlpzz.com" target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-xs py-1.5 flex items-center gap-1.5">
            <Globe size={12} /> soymattlpzz.com
          </a>
        </div>
      </div>
    </div>
  )
}
