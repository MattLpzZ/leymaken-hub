import { useState } from 'react'
import { GitBranch, Terminal, Cloud } from 'lucide-react'
import { DashboardGrid } from '@/modules/mission-control/DashboardGrid'

export function InfraPage() {
  const [tab, setTab] = useState<'monitor' | 'devops'>('monitor')

  return (
    <div className="space-y-5 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>Infraestructura</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Docker · GitHub · Cloudflare · VPS · DevOps</p>
        </div>
      </div>

      <div className="flex gap-0 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        {[
          { id: 'monitor', label: 'Monitoreo' },
          { id: 'devops',  label: 'DevOps' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as 'monitor' | 'devops')}
            className="px-4 py-2 text-sm transition-colors relative"
            style={{ color: tab === t.id ? 'var(--accent)' : 'var(--text-3)' }}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {tab === 'monitor' && (
        <div className="flex-1 overflow-y-auto">
          <DashboardGrid />
        </div>
      )}

      {tab === 'devops' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              icon: GitBranch,
              color: 'bg-violet-500/15',
              iconColor: 'text-violet-400',
              label: 'Repositorios',
              desc: 'Clonar repositorios, ejecutar git pull en proyectos del VPS y gestionar ramas.',
            },
            {
              icon: Terminal,
              color: 'bg-sky-500/15',
              iconColor: 'text-sky-400',
              label: 'Docker Deploy',
              desc: 'Instalar nuevos servicios Docker, actualizar imágenes, gestionar volúmenes y compose.',
            },
            {
              icon: Cloud,
              color: 'bg-orange-500/15',
              iconColor: 'text-orange-400',
              label: 'Workers / Edge',
              desc: 'Deploy a Cloudflare Workers, gestionar dominios, DNS y certificados SSL.',
            },
          ].map(({ icon: Icon, color, iconColor, label, desc }) => (
            <div key={label} className="card flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon size={14} className={iconColor} />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{label}</p>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{desc}</p>
              <span className="badge badge-gray text-[10px] self-start">Próximamente</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
