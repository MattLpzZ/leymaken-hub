import { useAuthStore } from '@/stores/authStore'

export function Header() {
  const { user, logout } = useAuthStore()

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b flex-shrink-0"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <span style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
        hub.leymaken.com
      </span>
      <div className="flex items-center gap-3">
        <span style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>{user?.name}</span>
        <button className="btn-secondary text-xs" onClick={logout}>Salir</button>
      </div>
    </header>
  )
}
