import { InfraOverview }   from './InfraOverview'
import { GitHubFeed }      from './GitHubFeed'
import { CloudflarePanel } from './CloudflarePanel'
import { LiveFeed }        from './LiveFeed'

export function MissionControlPage() {
  return (
    <div className="h-full flex flex-col gap-4">
      <h1 className="text-xl font-bold flex-shrink-0" style={{ color: 'var(--text-1)' }}>Mission Control</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <InfraOverview />
        <GitHubFeed />
        <CloudflarePanel />
      </div>
      <div className="flex-shrink-0">
        <LiveFeed />
      </div>
    </div>
  )
}
