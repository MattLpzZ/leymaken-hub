import { useEffect, useState, useRef } from 'react'
import {
  Plus, X, ChevronLeft, Trash2, MessageCircle, Copy, Check,
  QrCode, RefreshCw, Wifi, WifiOff, Database, Menu as MenuIcon,
} from 'lucide-react'
import {
  WhatsAppBotsService,
  type BotConfig,
  type BotMenuItem,
  type WebjsStatus,
} from '@/lib/services/whatsapp-bots.service'

const N8N_BASE = 'https://n8n.leymaken.com/webhook'

const PROVIDER_LABEL: Record<BotConfig['provider'], string> = {
  wwebjs:    'WhatsApp Web JS',
  evolution: 'Evolution API',
  meta:      'Meta Cloud API',
}

const PROVIDER_BADGE: Record<BotConfig['provider'], string> = {
  wwebjs:    'badge badge-green',
  evolution: 'badge badge-blue',
  meta:      'badge badge-purple',
}

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return { copied, copy }
}

function QrPanel({ botId }: { botId: number }) {
  const [status, setStatus] = useState<WebjsStatus['status']>('not_initialized')
  const [qrPng, setQrPng] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPoll = () => { if (pollRef.current) clearInterval(pollRef.current) }

  const fetchStatus = async () => {
    try {
      const s = await WhatsAppBotsService.webjsStatus(botId)
      setStatus(s.status)
      if (s.status === 'qr_needed') {
        const { qr } = await WhatsAppBotsService.webjsQr(botId)
        setQrPng(qr)
      } else if (s.status === 'connected') {
        setQrPng(null)
        stopPoll()
      }
    } catch {}
  }

  useEffect(() => {
    fetchStatus()
    return stopPoll
  }, [botId])

  async function handleInit() {
    setLoading(true)
    try {
      const result = await WhatsAppBotsService.webjsInit(botId)
      setStatus(result.status as WebjsStatus['status'])
      if (result.qr) setQrPng(result.qr)
      stopPoll()
      pollRef.current = setInterval(fetchStatus, 4000)
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    setLoading(true)
    try {
      await WhatsAppBotsService.webjsDisconnect(botId)
      setStatus('not_initialized')
      setQrPng(null)
      stopPoll()
    } finally {
      setLoading(false)
    }
  }

  const statusConfig: Record<string, { label: string; badge: string }> = {
    not_initialized: { label: 'Sin iniciar', badge: 'badge badge-gray' },
    initializing:    { label: 'Iniciando...', badge: 'badge badge-amber' },
    qr_needed:       { label: 'Esperando QR', badge: 'badge badge-amber' },
    connected:       { label: 'Conectado', badge: 'badge badge-green' },
    disconnected:    { label: 'Desconectado', badge: 'badge badge-red' },
    auth_failed:     { label: 'Auth fallida', badge: 'badge badge-red' },
    error:           { label: 'Error', badge: 'badge badge-red' },
  }
  const sc = statusConfig[status] ?? statusConfig.not_initialized

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className={sc.badge}>{sc.label}</span>
        {status === 'connected' && <Wifi size={14} className="text-emerald-400" />}
        {(status === 'disconnected' || status === 'not_initialized') && <WifiOff size={14} className="text-gray-500" />}
      </div>
      {qrPng && status === 'qr_needed' && (
        <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white w-fit">
          <img src={qrPng} alt="QR WhatsApp" className="w-48 h-48" />
          <p className="text-xs text-gray-600">Escanea con WhatsApp en tu teléfono</p>
        </div>
      )}
      <div className="flex gap-2">
        {status !== 'connected' && (
          <button onClick={handleInit} disabled={loading || status === 'initializing'}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            {loading || status === 'initializing'
              ? <RefreshCw size={13} className="animate-spin" />
              : <QrCode size={13} />}
            {status === 'qr_needed' ? 'Nuevo QR' : 'Iniciar sesión'}
          </button>
        )}
        {status === 'connected' && (
          <button onClick={handleDisconnect} disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm px-4 py-2 text-red-400 border-red-500/30">
            <WifiOff size={13} /> Desconectar
          </button>
        )}
        {status !== 'not_initialized' && status !== 'initializing' && (
          <button onClick={fetchStatus} className="btn-secondary px-3 py-2" title="Actualizar estado">
            <RefreshCw size={13} />
          </button>
        )}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
        La sesión se mantiene activa en el servidor.
      </p>
    </div>
  )
}

const EVO_MANAGER_URL = 'https://evolution.leymaken.com/manager'

const EVO_STATE_CONFIG: Record<string, { label: string; badge: string }> = {
  open:           { label: 'Instancia activa', badge: 'badge badge-blue' },
  connected:      { label: 'Instancia activa', badge: 'badge badge-blue' },
  close:          { label: 'Desconectado', badge: 'badge badge-red' },
  disconnected:   { label: 'Desconectado', badge: 'badge badge-red' },
  connecting:     { label: 'Conectando...', badge: 'badge badge-amber' },
  not_configured: { label: 'Sin configurar', badge: 'badge badge-gray' },
  no_apikey:      { label: 'Falta API key', badge: 'badge badge-gray' },
  error:          { label: 'Error', badge: 'badge badge-red' },
  unknown:        { label: 'Sin instancia', badge: 'badge badge-gray' },
}

function EvolutionPanel({ botId, instanceName, hasConfig }: { botId: number; instanceName?: string | null; hasConfig: boolean }) {
  const [state, setState] = useState<string>('unknown')
  const [webhook, setWebhook] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    if (!hasConfig) return
    WhatsAppBotsService.evolutionStatus(botId)
      .then(r => setState(r.state))
      .catch(() => setState('error'))
  }, [botId, hasConfig])

  async function handleSync() {
    setSyncing(true)
    try {
      const r = await WhatsAppBotsService.evolutionSync(botId)
      setState(r.state)
      setWebhook(r.webhook)
      setLastSync(new Date().toLocaleTimeString())
    } catch {
      setState('error')
    } finally {
      setSyncing(false)
    }
  }

  if (!hasConfig) {
    return (
      <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>Configuración pendiente. Sincroniza el bot para crear la instancia.</p>
      </div>
    )
  }

  const sc = EVO_STATE_CONFIG[state] ?? EVO_STATE_CONFIG.unknown
  const instanceExists = state === 'open' || state === 'connected' || state === 'connecting'

  return (
    <div className="space-y-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-emerald-400">Evolution API</p>
          <span className={sc.badge}>{sc.label}</span>
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5">
          <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sync...' : 'Sync'}
        </button>
      </div>
      {instanceExists && instanceName && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
          <p className="text-xs text-blue-300 font-medium">Instancia: <span className="font-mono">{instanceName}</span></p>
          <a href={EVO_MANAGER_URL} target="_blank" rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-1.5 text-xs px-3 py-1.5">
            <QrCode size={11} /> Abrir Evolution Manager
          </a>
        </div>
      )}
      {webhook && <p className="text-[10px] font-mono text-emerald-400/70">Webhook: {webhook}</p>}
      {lastSync && <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>Última sync: {lastSync}</p>}
    </div>
  )
}

const ITEM_BLANK: Partial<BotMenuItem> = {
  numero: 1, label: '', requires_verification: true,
  response_type: 'static', response_field: null, response_template: null, active: true, sort_order: 0,
}

function MenuTab({ bot, onUpdate }: { bot: BotConfig; onUpdate: (b: BotConfig) => void }) {
  const [items, setItems] = useState<BotMenuItem[]>(bot.menu_items ?? [])
  const [editing, setEditing] = useState<Partial<BotMenuItem> | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    try {
      if (editId) {
        const { data } = await WhatsAppBotsService.updateMenuItem(bot.id, editId, editing)
        setItems(prev => prev.map(i => i.id === editId ? data : i))
      } else {
        const { data } = await WhatsAppBotsService.addMenuItem(bot.id, editing)
        setItems(prev => [...prev, data])
      }
      setEditing(null)
      setEditId(null)
    } finally { setSaving(false) }
  }

  async function handleDelete(itemId: number) {
    if (!confirm('¿Eliminar opción?')) return
    await WhatsAppBotsService.removeMenuItem(bot.id, itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>Opciones que el bot presenta al usuario.</p>
        <button onClick={() => { setEditing({ ...ITEM_BLANK }); setEditId(null) }}
          className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5">
          <Plus size={12} /> Agregar opción
        </button>
      </div>
      {items.length === 0 && !editing && (
        <div className="card p-6 text-center">
          <MenuIcon size={24} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-3)' }} />
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin opciones de menú</p>
        </div>
      )}
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="card-sm flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">{item.numero}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{item.label}</span>
                <span className="badge badge-gray text-[10px]">{item.response_type}</span>
                {item.requires_verification && <span className="badge badge-amber text-[10px]">cédula</span>}
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => { setEditing({ ...item }); setEditId(item.id) }}
                className="text-xs px-2 py-1 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
                style={{ color: 'var(--text-2)' }}>Editar</button>
              <button onClick={() => handleDelete(item.id)}
                className="p-1.5 rounded-lg border border-red-500/20 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <form onSubmit={handleSave} className="card space-y-3 border-emerald-500/30">
          <p className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>{editId ? 'Editando opción' : 'Nueva opción'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Número</label>
              <input type="number" min={1} max={9} required className="input"
                value={editing.numero ?? 1}
                onChange={e => setEditing(p => ({ ...p!, numero: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Tipo de respuesta</label>
              <select className="input" value={editing.response_type ?? 'static'}
                onChange={e => setEditing(p => ({ ...p!, response_type: e.target.value as BotMenuItem['response_type'] }))}>
                <option value="static">Texto fijo</option>
                <option value="db_field">Campo de BD</option>
                <option value="template">Plantilla</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Etiqueta</label>
            <input required className="input" placeholder="Consultar saldo"
              value={editing.label ?? ''} onChange={e => setEditing(p => ({ ...p!, label: e.target.value }))} />
          </div>
          {editing.response_type === 'static' && (
            <div>
              <label className="label">Respuesta fija</label>
              <textarea className="input" rows={2} value={editing.response_template ?? ''}
                onChange={e => setEditing(p => ({ ...p!, response_template: e.target.value }))} />
            </div>
          )}
          {editing.response_type === 'db_field' && (
            <div>
              <label className="label">Campo de la BD</label>
              <input className="input" placeholder="saldo_pendiente"
                value={editing.response_field ?? ''} onChange={e => setEditing(p => ({ ...p!, response_field: e.target.value }))} />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="req-ver" checked={editing.requires_verification ?? true}
              onChange={e => setEditing(p => ({ ...p!, requires_verification: e.target.checked }))} />
            <label htmlFor="req-ver" className="text-xs" style={{ color: 'var(--text-2)' }}>Requiere verificación de cédula</label>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => { setEditing(null); setEditId(null) }} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      )}
    </div>
  )
}

type DetailTab = 'general' | 'whatsapp' | 'database' | 'ia' | 'menu'

function DetailView({ bot: initial, onBack, onUpdate }: {
  bot: BotConfig
  onBack: () => void
  onUpdate: (b: BotConfig) => void
}) {
  const [bot, setBot] = useState(initial)
  const [tab, setTab] = useState<DetailTab>('whatsapp')
  const [form, setForm] = useState<Partial<BotConfig>>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; sample_columns?: string[] } | null>(null)
  const { copied, copy } = useCopy()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await WhatsAppBotsService.update(bot.id, form)
      setBot(data)
      onUpdate(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  async function handleTestConnection() {
    setTestResult(null)
    const result = await WhatsAppBotsService.testConnection(bot.id)
    setTestResult(result)
  }

  const webhookUrl = bot.webhook_path ? `${N8N_BASE}/${bot.webhook_path}` : null

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'general',  label: 'General' },
    { id: 'ia',       label: 'IA' },
    { id: 'database', label: 'Base de Datos' },
    { id: 'menu',     label: 'Menú' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
          <ChevronLeft size={16} style={{ color: 'var(--text-2)' }} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{bot.name}</h2>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{bot.empresa}</p>
        </div>
        <span className={PROVIDER_BADGE[bot.provider]}>{PROVIDER_LABEL[bot.provider]}</span>
        <span className={bot.status === 'active' ? 'badge badge-green' : 'badge badge-gray'}>
          {bot.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {webhookUrl && (
        <div className="card-sm flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>Webhook n8n</p>
            <p className="text-xs font-mono truncate text-emerald-400">{webhookUrl}</p>
          </div>
          <button onClick={() => copy(webhookUrl)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0">
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} style={{ color: 'var(--text-3)' }} />}
          </button>
        </div>
      )}

      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.id
                ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/25'
                : 'text-gray-400 hover:text-gray-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'whatsapp' && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="card space-y-4">
            <div>
              <label className="label">Proveedor</label>
              <select className="input" value={form.provider ?? 'wwebjs'}
                onChange={e => setForm(p => ({ ...p, provider: e.target.value as BotConfig['provider'] }))}>
                <option value="wwebjs">WhatsApp Web JS</option>
                <option value="evolution">Evolution API</option>
                <option value="meta">Meta Cloud API</option>
              </select>
            </div>
            {(form.provider ?? bot.provider) === 'wwebjs' && <QrPanel botId={bot.id} />}
            {(form.provider ?? bot.provider) === 'evolution' && (
              <EvolutionPanel botId={bot.id} instanceName={bot.evolution_instance} hasConfig={!!(bot.evolution_host && bot.evolution_instance)} />
            )}
            {(form.provider ?? bot.provider) === 'meta' && (
              <>
                <div>
                  <label className="label">Phone Number ID</label>
                  <input className="input" value={form.meta_phone_id ?? ''} onChange={e => setForm(p => ({ ...p, meta_phone_id: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Access Token</label>
                  <textarea className="input" rows={3} value={form.meta_token ?? ''} onChange={e => setForm(p => ({ ...p, meta_token: e.target.value }))} />
                </div>
              </>
            )}
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm px-4 py-2">
            {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      )}

      {tab === 'general' && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="card space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Nombre del bot</label>
                <input required className="input" value={form.name ?? ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label className="label">Empresa</label>
                <input required className="input" value={form.empresa ?? ''} onChange={e => setForm(p => ({ ...p, empresa: e.target.value }))} /></div>
              <div><label className="label">Webhook path</label>
                <input className="input" value={form.webhook_path ?? ''} onChange={e => setForm(p => ({ ...p, webhook_path: e.target.value }))} /></div>
              <div><label className="label">Estado</label>
                <select className="input" value={form.status ?? 'inactive'} onChange={e => setForm(p => ({ ...p, status: e.target.value as BotConfig['status'] }))}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select></div>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm px-4 py-2">
            {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      )}

      {tab === 'ia' && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="card space-y-4">
            <div><label className="label">Modelo Ollama</label>
              <input className="input" placeholder="llama3.2" value={form.ai_model ?? ''} onChange={e => setForm(p => ({ ...p, ai_model: e.target.value || null }))} /></div>
            <div><label className="label">Prompt del sistema</label>
              <textarea className="input" rows={5} value={form.ai_system_prompt ?? ''} onChange={e => setForm(p => ({ ...p, ai_system_prompt: e.target.value || null }))} /></div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm px-4 py-2">
            {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      )}

      {tab === 'database' && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="card space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><label className="label">Host</label>
                <input className="input" value={form.db_host ?? ''} onChange={e => setForm(p => ({ ...p, db_host: e.target.value }))} /></div>
              <div><label className="label">Puerto</label>
                <input type="number" className="input" value={form.db_port ?? 3306} onChange={e => setForm(p => ({ ...p, db_port: Number(e.target.value) }))} /></div>
              <div><label className="label">Base de datos</label>
                <input className="input" value={form.db_name ?? ''} onChange={e => setForm(p => ({ ...p, db_name: e.target.value }))} /></div>
              <div><label className="label">Usuario</label>
                <input className="input" value={form.db_user ?? ''} onChange={e => setForm(p => ({ ...p, db_user: e.target.value }))} /></div>
              <div><label className="label">Contraseña</label>
                <input type="password" className="input" value={form.db_password ?? ''} onChange={e => setForm(p => ({ ...p, db_password: e.target.value }))} /></div>
            </div>
            <div><label className="label">Tabla</label>
              <input className="input" value={form.db_table ?? ''} onChange={e => setForm(p => ({ ...p, db_table: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary text-sm px-4 py-2">
              {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={handleTestConnection} className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
              <Database size={13} /> Probar conexión
            </button>
          </div>
          {testResult && (
            <div className={`card-sm ${testResult.ok ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
              <p className={`text-xs font-medium ${testResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {testResult.ok ? '✓ Conexión exitosa' : '✗ ' + testResult.message}
              </p>
              {testResult.sample_columns && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Columnas: {testResult.sample_columns.join(', ')}</p>
              )}
            </div>
          )}
        </form>
      )}

      {tab === 'menu' && <MenuTab bot={bot} onUpdate={updated => { setBot(updated); onUpdate(updated) }} />}
    </div>
  )
}

const BLANK_FORM = {
  name: '', empresa: '', webhook_path: '', provider: 'wwebjs' as BotConfig['provider'],
  moneda: 'RD$', session_timeout_minutes: 30,
}

export default function WhatsAppBotsTab() {
  const [bots, setBots] = useState<BotConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<BotConfig | null>(null)
  const [evoStates, setEvoStates] = useState<Record<number, string>>({})
  const { copied, copy } = useCopy()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data } = await WhatsAppBotsService.list()
      setBots(data)
      data.filter(b => b.provider === 'evolution' && b.evolution_host && b.evolution_instance).forEach(b => {
        WhatsAppBotsService.evolutionStatus(b.id)
          .then(r => setEvoStates(prev => ({ ...prev, [b.id]: r.state })))
          .catch(() => {})
      })
    } finally { setLoading(false) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: Partial<BotConfig> = { ...form }
      if (payload.provider === 'evolution') delete payload.webhook_path
      const { data } = await WhatsAppBotsService.create(payload)
      setBots(prev => [data, ...prev])
      setForm(BLANK_FORM)
      setShowCreate(false)
      setSelected(data)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('¿Eliminar este bot?')) return
    await WhatsAppBotsService.remove(id)
    setBots(prev => prev.filter(b => b.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  async function handleToggleStatus(bot: BotConfig, e: React.MouseEvent) {
    e.stopPropagation()
    const newStatus = bot.status === 'active' ? 'inactive' : 'active'
    const { data } = await WhatsAppBotsService.update(bot.id, { status: newStatus })
    setBots(prev => prev.map(b => b.id === bot.id ? { ...b, ...data } : b))
  }

  if (selected) {
    return (
      <DetailView
        bot={selected}
        onBack={() => setSelected(null)}
        onUpdate={updated => {
          setSelected(updated)
          setBots(prev => prev.map(b => b.id === updated.id ? updated : b))
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>WhatsApp Bots</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Configura bots multi-cliente gestionados por n8n</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Plus size={14} /> Nuevo Bot
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Nuevo Bot</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-800"><X size={16} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div><label className="label">Nombre</label>
                <input required className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="label">Empresa</label>
                <input required className="input" value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} /></div>
              <div><label className="label">Proveedor</label>
                <select className="input" value={form.provider}
                  onChange={e => setForm(f => ({ ...f, provider: e.target.value as BotConfig['provider'], webhook_path: '' }))}>
                  <option value="wwebjs">WhatsApp Web JS</option>
                  <option value="evolution">Evolution API</option>
                  <option value="meta">Meta Cloud API</option>
                </select></div>
              {form.provider !== 'evolution' && (
                <div><label className="label">Webhook path</label>
                  <input required className="input" placeholder="isp-norte-bot" value={form.webhook_path}
                    onChange={e => setForm(f => ({ ...f, webhook_path: e.target.value }))} /></div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creando...' : 'Crear Bot'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center"><p className="text-sm" style={{ color: 'var(--text-3)' }}>Cargando bots...</p></div>
      ) : bots.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageCircle size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-3)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Sin bots configurados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bots.map(bot => (
            <div key={bot.id} onClick={() => setSelected(bot)}
              className="card p-4 cursor-pointer hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{bot.name}</p>
                    <span className={PROVIDER_BADGE[bot.provider]}>{PROVIDER_LABEL[bot.provider]}</span>
                    <span className={bot.status === 'active' ? 'badge badge-green' : 'badge badge-gray'}>
                      {bot.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{bot.empresa}</p>
                  {bot.webhook_path && (
                    <div className="flex items-center gap-1.5 mt-1.5" onClick={e => e.stopPropagation()}>
                      <p className="text-[10px] font-mono text-emerald-400 truncate max-w-xs">{N8N_BASE}/{bot.webhook_path}</p>
                      <button onClick={() => copy(`${N8N_BASE}/${bot.webhook_path}`)} className="p-0.5" style={{ color: 'var(--text-3)' }}>
                        {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={e => handleToggleStatus(bot, e)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                      bot.status === 'active'
                        ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                        : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                    }`}>
                    {bot.status === 'active' ? <><WifiOff size={11} /> Pausar</> : <><Wifi size={11} /> Activar</>}
                  </button>
                  <button onClick={e => handleDelete(bot.id, e)}
                    className="p-1.5 rounded-lg border border-red-500/20 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={13} />
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
