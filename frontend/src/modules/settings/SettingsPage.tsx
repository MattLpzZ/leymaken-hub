import { useState } from 'react'
import { PlugZap, CheckCircle, LogOut, Loader } from 'lucide-react'
import { useBizAuthStore } from '@/stores/bizAuthStore'

export function SettingsPage() {
  const { token, user, loading, error, connect, disconnect } = useBizAuthStore()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    await connect(email, password)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Configuración</h1>

      {/* soymatt-platform connection */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <PlugZap size={16} style={{ color: 'var(--text-2)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>soymatt-platform</h2>
          {token && <span className="badge badge-green ml-auto">Conectado</span>}
        </div>

        {token && user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded" style={{ background: 'var(--surface-2)' }}>
              <CheckCircle size={16} style={{ color: '#10b981' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{user.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{user.email} · api.leymaken.com</p>
              </div>
            </div>
            <button
              className="btn-secondary text-sm flex items-center gap-2"
              onClick={disconnect}
            >
              <LogOut size={13} /> Desconectar
            </button>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-3">
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Conecta con tu cuenta de api.leymaken.com para acceder a CRM y Facturación.
            </p>
            <input
              type="email"
              className="input w-full text-sm"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="input w-full text-sm"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" className="btn-primary text-sm flex items-center gap-2 w-full justify-center" disabled={loading}>
              {loading ? <Loader size={13} className="animate-spin" /> : <PlugZap size={13} />}
              {loading ? 'Conectando...' : 'Conectar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
