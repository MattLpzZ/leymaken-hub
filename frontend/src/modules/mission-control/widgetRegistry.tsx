import type { ComponentType } from 'react'
import { InfraOverview }   from './InfraOverview'
import { GitHubFeed }      from './GitHubFeed'
import { CloudflarePanel } from './CloudflarePanel'
import { HestiaPanel }     from './HestiaPanel'
import { VpsStatsBar }     from './VpsStatsBar'
import { LiveFeed }        from './LiveFeed'

export interface WidgetDef {
  id: string
  title: string
  component: ComponentType
  defaultW: 1 | 2 | 3 | 4
  zone: 'top' | 'main' | 'bottom'
}

export const WIDGET_REGISTRY: Record<string, WidgetDef> = {
  vps_stats:  { id: 'vps_stats',  title: 'VPS Stats',  component: VpsStatsBar,     defaultW: 4, zone: 'top'    },
  docker:     { id: 'docker',     title: 'Docker',     component: InfraOverview,   defaultW: 1, zone: 'main'   },
  github:     { id: 'github',     title: 'GitHub',     component: GitHubFeed,      defaultW: 1, zone: 'main'   },
  cloudflare: { id: 'cloudflare', title: 'Cloudflare', component: CloudflarePanel, defaultW: 1, zone: 'main'   },
  hestia:     { id: 'hestia',     title: 'HestiaCP',   component: HestiaPanel,     defaultW: 1, zone: 'main'   },
  live_feed:  { id: 'live_feed',  title: 'Live Feed',  component: LiveFeed,        defaultW: 4, zone: 'bottom' },
}
