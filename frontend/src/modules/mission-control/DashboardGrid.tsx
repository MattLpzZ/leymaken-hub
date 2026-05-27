import { Settings, Check, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { WIDGET_REGISTRY } from './widgetRegistry'
import { WidgetShell } from './WidgetShell'

const MAIN_IDS = ['docker', 'github', 'cloudflare', 'hestia']

function BannerEditOverlay({ title, onHide }: { title: string; onHide: () => void }) {
  return (
    <div
      className="absolute inset-0 z-10 rounded flex items-center px-3 gap-2"
      style={{ border: '2px dashed #10b981', background: 'rgba(0,0,0,0.5)' }}
    >
      <span className="text-xs font-medium flex-1" style={{ color: '#e5e7eb' }}>{title}</span>
      <button onClick={onHide} style={{ lineHeight: 0 }}>
        <EyeOff size={13} style={{ color: '#9ca3af' }} />
      </button>
    </div>
  )
}

export function DashboardGrid() {
  const { widgets, editMode, toggleEditMode, setWidgetWidth, toggleWidget, moveWidget, resetLayout } = useDashboardStore()

  const wMap = Object.fromEntries(widgets.map(w => [w.id, w]))

  const visibleMain = MAIN_IDS
    .map(id => wMap[id])
    .filter(w => w?.visible)
    .sort((a, b) => a.order - b.order)

  const hiddenAll = widgets.filter(w => !w.visible)
  const isVisible = (id: string) => wMap[id]?.visible ?? true

  const TopDef    = WIDGET_REGISTRY.vps_stats
  const BottomDef = WIDGET_REGISTRY.live_feed

  return (
    <div className="h-full flex flex-col gap-3">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Mission Control</h1>
        <div className="flex items-center gap-2">
          {editMode && (
            <button onClick={resetLayout} className="btn-secondary text-xs flex items-center gap-1">
              <RotateCcw size={11} /> Reset
            </button>
          )}
          <button
            onClick={toggleEditMode}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors"
            style={{
              background: editMode ? '#10b981' : 'var(--surface-2)',
              color: editMode ? '#fff' : 'var(--text-2)',
            }}
          >
            {editMode ? <><Check size={12} /> Guardar</> : <><Settings size={12} /> Editar</>}
          </button>
        </div>
      </div>

      {/* ── Hidden widgets tray ── */}
      {editMode && hiddenAll.length > 0 && (
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>Ocultos:</span>
          {hiddenAll.map(w => {
            const def = WIDGET_REGISTRY[w.id]
            if (!def) return null
            return (
              <button
                key={w.id}
                onClick={() => toggleWidget(w.id)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              >
                <Eye size={10} /> {def.title}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Top: VPS Stats ── */}
      {isVisible('vps_stats') && TopDef && (
        <div className="flex-shrink-0 relative">
          <TopDef.component />
          {editMode && <BannerEditOverlay title="VPS Stats" onHide={() => toggleWidget('vps_stats')} />}
        </div>
      )}

      {/* ── Main widget grid ── */}
      <div className="grid grid-cols-4 gap-3 flex-1 min-h-0">
        {visibleMain.map((wConfig, idx) => {
          const def = WIDGET_REGISTRY[wConfig.id]
          if (!def) return null
          const Component = def.component
          return (
            <WidgetShell
              key={wConfig.id}
              id={wConfig.id}
              w={wConfig.w}
              title={def.title}
              editMode={editMode}
              isFirst={idx === 0}
              isLast={idx === visibleMain.length - 1}
              onWidthChange={w => setWidgetWidth(wConfig.id, w)}
              onMove={dir => moveWidget(wConfig.id, dir)}
              onHide={() => toggleWidget(wConfig.id)}
            >
              <Component />
            </WidgetShell>
          )
        })}
      </div>

      {/* ── Bottom: Live Feed ── */}
      {isVisible('live_feed') && BottomDef && (
        <div className="flex-shrink-0 relative">
          <BottomDef.component />
          {editMode && <BannerEditOverlay title="Live Feed" onHide={() => toggleWidget('live_feed')} />}
        </div>
      )}
    </div>
  )
}
