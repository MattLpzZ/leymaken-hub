import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface PaginationProps {
  page: number
  total: number
  perPage?: number
  onChange: (page: number) => void
}

export function Pagination({ page, total, perPage = 10, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
        Mostrando {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: 'var(--text-2)', border: '1px solid var(--border)' }}
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-xs" style={{ color: 'var(--text-3)' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={clsx(
                'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                p === page
                  ? 'bg-emerald-600 text-white'
                  : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: 'var(--text-2)', border: '1px solid var(--border)' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default Pagination
