import { InfraOverview }   from './InfraOverview'
import { GitHubFeed }      from './GitHubFeed'
import { CloudflarePanel } from './CloudflarePanel'
import { HestiaPanel }     from './HestiaPanel'
import { LiveFeed }        from './LiveFeed'
import { VpsStatsBar }     from './VpsStatsBar'

export function MissionControlPage() {
  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between flex-shrink-0">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Mission Control</h1>
      </div>

      <VpsStatsBar />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 flex-1 min-h-0">
        <InfraOverview />
        <GitHubFeed />
        <CloudflarePanel />
        <HestiaPanel />
      </div>

      <div className="flex-shrink-0">
        <LiveFeed />
      </div>
    </div>
  )
}
