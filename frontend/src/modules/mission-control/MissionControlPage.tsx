import { InfraOverview }   from './InfraOverview'
import { GitHubFeed }      from './GitHubFeed'
import { CloudflarePanel } from './CloudflarePanel'
import { LiveFeed }        from './LiveFeed'

export function MissionControlPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-1)' }}>Mission Control</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <InfraOverview />
        <GitHubFeed />
        <CloudflarePanel />
        <div className="lg:col-span-2 xl:col-span-3">
          <LiveFeed />
        </div>
      </div>
    </div>
  )
}
