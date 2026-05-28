import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: string
  trend?: { value: number; label: string }
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'bg-emerald-600', trend }: StatCardProps) {
  return (
    <div className="card-sm flex items-start gap-4">
      <div className={clsx('flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl', color)}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-3)' }}>{title}</p>
        <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text-1)' }}>{value}</p>
        {subtitle && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{subtitle}</p>}
        {trend && (
          <p className={clsx('text-xs mt-1 font-medium', trend.value >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  )
}

export default StatCard
