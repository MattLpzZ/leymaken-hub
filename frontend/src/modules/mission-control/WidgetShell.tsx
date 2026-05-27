import { GripVertical, ChevronLeft, ChevronRight, EyeOff } from 'lucide-react'

const SPAN: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
}

interface Props {
  id: string
  w: 1 | 2 | 3 | 4
  title: string
  editMode: boolean
  isFirst: boolean
  isLast: boolean
  onWidthChange: (w: 1 | 2 | 3 | 4) => void
  onMove: (dir: 'left' | 'right') => void
  onHide: () => void
  children: React.ReactNode
}

export function WidgetShell({ w, title, editMode, isFirst, isLast, onWidthChange, onMove, onHide, children }: Props) {
  return (
    <div className={`${SPAN[w]} min-h-0 relative`}>
      {children}

      {editMode && (
        <div
          className="absolute inset-0 z-10 rounded-lg flex flex-col"
          style={{ border: '2px dashed #10b981', background: 'rgba(0,0,0,0.58)' }}
        >
          <div className="flex items-center gap-1.5 px-3 py-2">
            <GripVertical size={14} style={{ color: '#6b7280', cursor: 'grab' }} />
            <span className="text-xs font-medium flex-1 truncate" style={{ color: '#e5e7eb' }}>{title}</span>

            <div className="flex gap-0.5 mr-1">
              {([1, 2, 3, 4] as const).map(size => (
                <button
                  key={size}
                  onClick={() => onWidthChange(size)}
                  className="text-xs w-5 h-5 rounded flex items-center justify-center font-mono leading-none"
                  style={{
                    background: w === size ? '#10b981' : 'rgba(255,255,255,0.12)',
                    color: w === size ? '#fff' : '#9ca3af',
                  }}
                >
                  {size}
                </button>
              ))}
            </div>

            <button
              onClick={() => onMove('left')}
              disabled={isFirst}
              style={{ opacity: isFirst ? 0.25 : 1, lineHeight: 0 }}
            >
              <ChevronLeft size={14} style={{ color: '#9ca3af' }} />
            </button>
            <button
              onClick={() => onMove('right')}
              disabled={isLast}
              style={{ opacity: isLast ? 0.25 : 1, lineHeight: 0 }}
            >
              <ChevronRight size={14} style={{ color: '#9ca3af' }} />
            </button>

            <button onClick={onHide} style={{ lineHeight: 0 }}>
              <EyeOff size={13} style={{ color: '#9ca3af' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
