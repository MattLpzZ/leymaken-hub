import { useState, useEffect } from 'react'
import { Plus, Copy, Trash2, X, Loader2, Key, ShieldOff, ShieldCheck } from 'lucide-react'
import Badge from '@/components/Badge'
import {
  SaasCompaniesService, ApiKeysService,
  type SaasCompany, type ApiKey,
} from '@/lib/services/saas.service'

const BLANK_KEY_FORM = { label: '', environment: 'production' as 'production' | 'sandbox', notes: '' }

export function ApiKeysTab() {
  const [companies, setCompanies]     = useState<SaasCompany[]>([])
  const [loadingCo, setLoadingCo]     = useState(true)
  const [selectedCo, setSelectedCo]  = useState<number | ''>('')

  const [keys, setKeys]               = useState<ApiKey[]>([])
  const [loadingKeys, setLoadingKeys] = useState(false)

  const [showCreate, setShowCreate]   = useState(false)
  const [keyForm, setKeyForm]         = useState(BLANK_KEY_FORM)
  const [creating, setCreating]       = useState(false)

  // Revealed key shown once after generation
  const [revealedKey, setRevealedKey] = useState<string | null>(null)

  const [deleteFor, setDeleteFor]     = useState<ApiKey | null>(null)
  const [deleting, setDeleting]       = useState(false)

  useEffect(() => {
    SaasCompaniesService.list()
      .then(c => { setCompanies(c); if (c.length > 0) setSelectedCo(c[0].id) })
      .finally(() => setLoadingCo(false))
  }, [])

  useEffect(() => {
    if (!selectedCo) { setKeys([]); return }
    setLoadingKeys(true)
    ApiKeysService.list(selectedCo)
      .then(setKeys)
      .finally(() => setLoadingKeys(false))
  }, [selectedCo])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCo) return
    setCreating(true)
    try {
      const res = await ApiKeysService.create(selectedCo, keyForm)
      if (res.key) setRevealedKey(res.key)
      // Add to list (without the full key)
      const { key: _key, ...rest } = res
      setKeys(prev => [rest as ApiKey, ...prev])
      setKeyForm(BLANK_KEY_FORM)
      setShowCreate(false)
    } finally { setCreating(false) }
  }

  const handleToggleActive = async (k: ApiKey) => {
    const next = !k.active
    setKeys(prev => prev.map(x => x.id === k.id ? { ...x, active: next } : x))
    try { await ApiKeysService.update(selectedCo as number, k.id, { active: next }) }
    catch { setKeys(prev => prev.map(x => x.id === k.id ? { ...x, active: k.active } : x)) }
  }

  const handleToggleKillSwitch = async (k: ApiKey) => {
    const next = !k.kill_switch
    setKeys(prev => prev.map(x => x.id === k.id ? { ...x, kill_switch: next } : x))
    try { await ApiKeysService.update(selectedCo as number, k.id, { kill_switch: next }) }
    catch { setKeys(prev => prev.map(x => x.id === k.id ? { ...x, kill_switch: k.kill_switch } : x)) }
  }

  const handleDelete = async () => {
    if (!deleteFor || !selectedCo) return
    setDeleting(true)
    try {
      await ApiKeysService.remove(selectedCo as number, deleteFor.id)
      setKeys(prev => prev.filter(k => k.id !== deleteFor.id))
      setDeleteFor(null)
    } finally { setDeleting(false) }
  }

  return (
    <div className="space-y-5">
      {/* Company selector */}
      <div className="flex items-center gap-3">
        <label className="label whitespace-nowrap">Empresa</label>
        {loadingCo ? (
          <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-3)' }} />
        ) : (
          <select className="input max-w-xs" value={selectedCo}
            onChange={e => setSelectedCo(e.target.value ? Number(e.target.value) : '')}>
            <option value="">— Selecciona una empresa —</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.subdomain})</option>
            ))}
          </select>
        )}
        {selectedCo !== '' && (
          <button className="btn-primary text-xs py-1.5 ml-auto" onClick={() => setShowCreate(true)}>
            <Plus size={13} /> Generar key
          </button>
        )}
      </div>

      {/* Revealed key modal */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border p-6 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
              <Key size={22} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: 'var(--text-1)' }}>API Key generada</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
                Guarda esta clave ahora — no se volverá a mostrar.
              </p>
            </div>
            <div className="rounded-lg p-3 font-mono text-sm break-all"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
              {revealedKey}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(revealedKey)}
              className="btn-secondary w-full justify-center gap-2">
              <Copy size={14} /> Copiar al portapapeles
            </button>
            <button onClick={() => setRevealedKey(null)} className="btn-primary w-full justify-center">
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Create key modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Generar API Key</p>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-500 hover:text-gray-300"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-4 space-y-4">
              <div>
                <label className="label">Etiqueta</label>
                <input required className="input" placeholder="Mi integración..."
                  value={keyForm.label} onChange={e => setKeyForm(f => ({ ...f, label: e.target.value }))} />
              </div>
              <div>
                <label className="label">Entorno</label>
                <select className="input" value={keyForm.environment}
                  onChange={e => setKeyForm(f => ({ ...f, environment: e.target.value as 'production' | 'sandbox' }))}>
                  <option value="production">Producción</option>
                  <option value="sandbox">Sandbox</option>
                </select>
              </div>
              <div>
                <label className="label">Notas (opcional)</label>
                <input className="input" placeholder="Uso interno..."
                  value={keyForm.notes} onChange={e => setKeyForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? <Loader2 size={13} className="animate-spin" /> : 'Generar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border p-6 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: 'var(--text-1)' }}>Revocar API Key</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
                Se eliminará <strong style={{ color: 'var(--text-1)' }}>{deleteFor.label}</strong>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteFor(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <><Trash2 size={13} /> Revocar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keys list */}
      {!selectedCo ? (
        <div className="card text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>
          Selecciona una empresa para ver sus API Keys.
        </div>
      ) : loadingKeys ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} />
        </div>
      ) : keys.length === 0 ? (
        <div className="card text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>
          Esta empresa no tiene API Keys. Genera la primera.
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map(k => (
            <div key={k.id} className="card p-4">
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  k.kill_switch ? 'bg-red-500/10' : k.active ? 'bg-emerald-500/10' : 'bg-gray-500/10'
                }`}>
                  <Key size={16} className={k.kill_switch ? 'text-red-400' : k.active ? 'text-emerald-400' : 'text-gray-500'} />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{k.label}</p>
                    <Badge variant={k.environment === 'production' ? 'blue' : 'amber'}>
                      {k.environment === 'production' ? 'Producción' : 'Sandbox'}
                    </Badge>
                    {k.kill_switch && <Badge variant="red">Kill Switch</Badge>}
                    {!k.active && !k.kill_switch && <Badge variant="gray">Inactiva</Badge>}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <code className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800"
                      style={{ color: 'var(--text-2)' }}>{k.key_display}</code>
                    <button onClick={() => navigator.clipboard.writeText(k.key_display)}
                      className="p-0.5 text-gray-600 hover:text-gray-300" title="Copiar prefijo">
                      <Copy size={10} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--text-3)' }}>
                    {k.last_used_at && <span>Último uso: {new Date(k.last_used_at).toLocaleDateString()}</span>}
                    <span>{k.requests_count.toLocaleString()} requests</span>
                    {k.notes && <span style={{ color: 'var(--text-2)' }}>{k.notes}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Toggle active */}
                  <button onClick={() => handleToggleActive(k)}
                    className={`p-1.5 rounded-md transition-colors ${k.active
                      ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                      : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                    title={k.active ? 'Desactivar key' : 'Activar key'}>
                    {k.active ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                  </button>

                  {/* Kill switch toggle */}
                  <button onClick={() => handleToggleKillSwitch(k)}
                    className={`p-1.5 rounded-md transition-colors text-xs font-mono ${k.kill_switch
                      ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                      : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'}`}
                    title={k.kill_switch ? 'Desactivar kill switch' : 'Activar kill switch'}>
                    KS
                  </button>

                  {/* Delete */}
                  <button onClick={() => setDeleteFor(k)}
                    className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Revocar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
