import clsx from 'clsx'

type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'gray' | 'cyan'

const variants: Record<BadgeVariant, string> = {
  green:  'badge-green',
  red:    'badge-red',
  amber:  'badge-amber',
  blue:   'badge-blue',
  purple: 'badge-purple',
  gray:   'badge-gray',
  cyan:   'badge-cyan',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export default function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={clsx(variants[variant], className)}>
      {children}
    </span>
  )
}
