import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WidgetConfig {
  id: string
  w: 1 | 2 | 3 | 4
  visible: boolean
  order: number
}

interface DashboardStore {
  widgets: WidgetConfig[]
  editMode: boolean
  toggleEditMode: () => void
  setWidgetWidth: (id: string, w: 1 | 2 | 3 | 4) => void
  toggleWidget: (id: string) => void
  moveWidget: (id: string, dir: 'left' | 'right') => void
  resetLayout: () => void
}

const DEFAULTS: WidgetConfig[] = [
  { id: 'vps_stats',   w: 4, visible: true, order: 0 },
  { id: 'docker',      w: 1, visible: true, order: 1 },
  { id: 'github',      w: 1, visible: true, order: 2 },
  { id: 'cloudflare',  w: 1, visible: true, order: 3 },
  { id: 'hestia',      w: 1, visible: true, order: 4 },
  { id: 'live_feed',   w: 4, visible: true, order: 5 },
]

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      widgets: DEFAULTS,
      editMode: false,

      toggleEditMode: () => set(s => ({ editMode: !s.editMode })),

      setWidgetWidth: (id, w) => set(s => ({
        widgets: s.widgets.map(wg => wg.id === id ? { ...wg, w } : wg),
      })),

      toggleWidget: (id) => set(s => ({
        widgets: s.widgets.map(wg => wg.id === id ? { ...wg, visible: !wg.visible } : wg),
      })),

      moveWidget: (id, dir) => set(s => {
        const mainIds = ['docker', 'github', 'cloudflare', 'hestia']
        const sorted = s.widgets
          .filter(w => mainIds.includes(w.id))
          .slice()
          .sort((a, b) => a.order - b.order)

        const idx = sorted.findIndex(w => w.id === id)
        if (idx === -1) return s
        const swap = dir === 'left' ? idx - 1 : idx + 1
        if (swap < 0 || swap >= sorted.length) return s

        const orderA = sorted[idx].order
        const orderB = sorted[swap].order
        return {
          widgets: s.widgets.map(wg => {
            if (wg.id === sorted[idx].id)  return { ...wg, order: orderB }
            if (wg.id === sorted[swap].id) return { ...wg, order: orderA }
            return wg
          }),
        }
      }),

      resetLayout: () => set({ widgets: DEFAULTS }),
    }),
    { name: 'hub-dashboard-layout' }
  )
)
