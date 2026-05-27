import { useEffect } from 'react'
import { useInfraStore } from '@/stores/infraStore'
import { GitBranch, ExternalLink } from 'lucide-react'

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export function GitHubFeed() {
  const { repos, loading, fetchGithub } = useInfraStore()
  useEffect(() => { fetchGithub() }, [])

  return (
    <div className="card h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>GitHub</h2>
        <span className="badge badge-gray">{repos.length} repos</span>
      </div>

      {loading.github && !repos.length ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Cargando...</p>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-0.5">
          {repos.map(r => (
            <div key={r.name} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{r.name}</span>
                  <span className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                    <GitBranch size={10} /> {r.default_branch}
                  </span>
                </div>
                <a href={r.html_url} target="_blank" rel="noreferrer" className="flex-shrink-0 ml-2">
                  <ExternalLink size={12} style={{ color: 'var(--text-3)' }} />
                </a>
              </div>
              {r.latest_commit && (
                <p className="text-xs truncate" style={{ color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--text-3)' }}>{r.latest_commit.sha} · </span>
                  {r.latest_commit.message}
                  <span style={{ color: 'var(--text-3)' }}> · {timeAgo(r.latest_commit.date)}</span>
                </p>
              )}
            </div>
          ))}
          {!repos.length && <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin repos</p>}
        </div>
      )}
    </div>
  )
}
