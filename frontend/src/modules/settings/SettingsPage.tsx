import { useEffect, useState } from 'react'
import { PlugZap, CheckCircle, LogOut, Loader, Key, Eye, EyeOff, Check, X } from 'lucide-react'
import { useBizAuthStore } from '@/stores/bizAuthStore'
import api from '@/lib/api'

/* ── Secrets ──────────────────────────────────────────────── */

interface Secret {
  key:     string
  label:   string
  group:   string
  mask:    boolean
  set:     boolean
  source:  'db' | 'env' | null
  preview: string | null
}

type SecretsByGroup = Record<string, Secret[]>

function SecretsSection() {
  const [secrets, setSecrets]   = useState<Secret[]>([])
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState<string | null>(null)
  const [value, setValue]       = useState('')
  const [saving, setSaving]     = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  useEffect(() => {
    api.get('/secrets').then(r => setSecrets(r.data)).finally(() => setLoading(false))
  }, [])

  const save = async (key: string) => {
    if (!value.trim()) return
    setSaving(key)
    try {
      await api.put(`/secrets/${key}`, { value: value.trim() })
      setSecrets(prev => prev.map(s => s.key === key
        ? { ...s, set: true, source: 'db', preview: s.mask ? '•'.repeat(Math.max(value.length - 4, 4)) + value.slice(-4) : value }
        : s
      ))
      setEditing(null)
      setValue('')
    } finally {
      setSaving(null)
    }
  }

  const cancel = () => { setEditing(null); setValue('') }

  const toggleReveal = (key: string) =>
    setRevealed(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })

  const grouped: SecretsByGroup = secrets.reduce((acc, s) => {
    if (!acc[s.group]) acc[s.group] = []
    acc[s.group].push(s)
    return acc
  }, {} as SecretsByGroup)

  if (loading) return <p className="text-xs py-3" style={{ color: 'var(--text-3)' }}>Cargando keys...</p>

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group}>
          <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{group}</p>
          <div className="divide-y rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
            {items.map(s => (
              <div key={s.key} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>{s.label}</span>
                  {s.source === 'db'  && <span className="badge badge-green text-xs">DB</span>}
                  {s.source === 'env' && <span className="badge badge-gray text-xs">.env</span>}
                  {!s.set            && <span className="badge badge-red text-xs">Sin configurar</span>}
                </div>

                {editing === s.key ? (
                  <div className="flex gap-2 mt-1">
                    <input
                      autoFocus
                      type={s.mask ? 'password' : 'text'}
                      className="input flex-1 text-xs font-mono"
                      placeholder={`Nuevo valor para ${s.key}`}
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') save(s.key); if (e.key === 'Escape') cancel() }}
                    />
                    <button
                      className="btn-primary text-xs px-2"
                      onClick={() => save(s.key)}
                      disabled={saving === s.key || !value.trim()}
                    >
                      {saving === s.key ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                    </button>
                    <button className="btn-secondary text-xs px-2" onClick={cancel}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <code className="text-xs flex-1" style={{ color: s.set ? 'var(--text-2)' : 'var(--text-3)' }}>
                      {s.set
                        ? (s.mask && !revealed.has(s.key) ? s.preview : s.preview)
                        : '—'
                      }
                    </code>
                    {s.set && s.mask && (
                      <button onClick={() => toggleReveal(s.key)} className="opacity-50 hover:opacity-100">
                        {revealed.has(s.key) ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    )}
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => { setEditing(s.key); setValue('') }}
                    >
                      {s.set ? 'Cambiar' : 'Configurar'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────── */

export function SettingsPage() {
  const { token, user, loading, error, connect, disconnect } = useBizAuthStore()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    await connect(email, password)
  }

  return (
    <div className="space-y-6 max-w-2xl">
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
            <button className="btn-secondary text-sm flex items-center gap-2" onClick={disconnect}>
              <LogOut size={13} /> Desconectar
            </button>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-3">
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Conecta con tu cuenta de api.leymaken.com para acceder a CRM y Facturación.
            </p>
            <input type="email" className="input w-full text-sm" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" className="input w-full text-sm" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" className="btn-primary text-sm flex items-center gap-2 w-full justify-center" disabled={loading}>
              {loading ? <Loader size={13} className="animate-spin" /> : <PlugZap size={13} />}
              {loading ? 'Conectando...' : 'Conectar'}
            </button>
          </form>
        )}
      </div>

      {/* API Keys */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Key size={16} style={{ color: 'var(--text-2)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>API Keys & Secrets</h2>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          Los valores guardados en DB tienen prioridad sobre el <code>.env</code>. Los cambios aplican inmediatamente sin reiniciar contenedores.
        </p>
        <SecretsSection />
      </div>
    </div>
  )
}
