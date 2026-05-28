import { useState, useEffect } from 'react'
import {
  Building2, User, Settings2, Palette, Bell, MessageCircle,
  Mail, Printer, Users, ScrollText, Shield, Loader2, Check,
  Eye, EyeOff, Send, Plus, Trash2, Edit2, X,
} from 'lucide-react'
import api from '@/lib/api'
import { SettingsService, UsersService, type HubSettings, type HubUser } from '@/lib/services/settings.service'

const TABS = [
  { id: 'empresa',    label: 'Empresa',     icon: Building2 },
  { id: 'perfil',     label: 'Perfil',      icon: User },
  { id: 'sistema',    label: 'Sistema',     icon: Settings2 },
  { id: 'apariencia', label: 'Apariencia',  icon: Palette },
  { id: 'alertas',    label: 'Alertas',     icon: Bell },
  { id: 'telegram',   label: 'Telegram',    icon: MessageCircle },
  { id: 'email',      label: 'Email',       icon: Mail },
  { id: 'impresion',  label: 'Impresión',   icon: Printer },
  { id: 'usuarios',   label: 'Usuarios',    icon: Users },
  { id: 'logs',       label: 'Logs',        icon: ScrollText },
  { id: 'seguridad',  label: 'Seguridad',   icon: Shield },
] as const

type TabId = typeof TABS[number]['id']

function SaveBar({ saving, saved, onSave }: { saving: boolean; saved: boolean; onSave: () => void }) {
  return (
    <div className="flex items-center justify-end pt-4 border-t border-gray-800">
      <button onClick={onSave} disabled={saving} className="btn-primary text-xs py-1.5 flex items-center gap-2 disabled:opacity-50">
        {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
        {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar cambios'}
      </button>
    </div>
  )
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-emerald-600' : 'bg-gray-700'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</span>
    </label>
  )
}

function PasswordField({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className="input pr-10"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const [tab, setTab]         = useState<TabId>('empresa')
  const [settings, setSettings] = useState<HubSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [users, setUsers]     = useState<HubUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  // Profile
  const [profileName, setProfileName]   = useState('')
  const [profileEmail, setProfileEmail] = useState('')

  // Password change
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew]         = useState('')
  const [pwConfirm, setPwConfirm] = useState('')

  // User form
  const [showUserForm, setShowUserForm] = useState(false)
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'viewer' })
  const [savingUser, setSavingUser] = useState(false)

  // Email test
  const [testEmailTo, setTestEmailTo] = useState('')
  const [testEmailStatus, setTestEmailStatus] = useState<'idle'|'sending'|'ok'|'error'>('idle')

  useEffect(() => {
    SettingsService.get()
      .then(s => { setSettings(s); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'usuarios' && users.length === 0) {
      setUsersLoading(true)
      UsersService.list().then(setUsers).finally(() => setUsersLoading(false))
    }
  }, [tab])

  const set = (key: keyof HubSettings, value: any) =>
    setSettings(s => ({ ...s, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      await SettingsService.update(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-emerald-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>Configuración</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Sistema, conexiones, usuarios y preferencias del hub</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-44 flex-shrink-0 space-y-0.5">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  active
                    ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/25'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 card space-y-5">

          {/* EMPRESA */}
          {tab === 'empresa' && (
            <>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Identidad de empresa</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Nombre comercial</label><input className="input" value={settings.company_name ?? ''} onChange={e => set('company_name', e.target.value)} placeholder="Leymaken" /></div>
                <div><label className="label">Slogan / Suite</label><input className="input" value={settings.company_slogan ?? ''} onChange={e => set('company_slogan', e.target.value)} placeholder="LEYMAKEN | HUB" /></div>
                <div><label className="label">Razón social</label><input className="input" value={settings.company_legal_name ?? ''} onChange={e => set('company_legal_name', e.target.value)} /></div>
                <div><label className="label">RNC</label><input className="input" value={settings.company_rnc ?? ''} onChange={e => set('company_rnc', e.target.value)} placeholder="1-23-45678-9" /></div>
                <div className="col-span-2"><label className="label">Dirección</label><input className="input" value={settings.company_address ?? ''} onChange={e => set('company_address', e.target.value)} /></div>
                <div><label className="label">Teléfono</label><input className="input" value={settings.company_phone ?? ''} onChange={e => set('company_phone', e.target.value)} /></div>
                <div><label className="label">Email</label><input className="input" type="email" value={settings.company_email ?? ''} onChange={e => set('company_email', e.target.value)} /></div>
                <div><label className="label">Sitio web</label><input className="input" value={settings.company_website ?? ''} onChange={e => set('company_website', e.target.value)} /></div>
                <div><label className="label">URL del logo</label><input className="input" value={settings.company_logo_url ?? ''} onChange={e => set('company_logo_url', e.target.value)} /></div>
              </div>
              {settings.company_logo_url && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                  <img src={settings.company_logo_url} alt="logo" className="h-10 object-contain" />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{settings.company_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{settings.company_slogan}</p>
                  </div>
                </div>
              )}
              <SaveBar saving={saving} saved={saved} onSave={save} />
            </>
          )}

          {/* PERFIL */}
          {tab === 'perfil' && (
            <>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Tu perfil</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Nombre</label><input className="input" value={profileName} onChange={e => setProfileName(e.target.value)} /></div>
                <div><label className="label">Email</label><input className="input" type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} /></div>
              </div>
              <SaveBar saving={saving} saved={saved} onSave={save} />
            </>
          )}

          {/* SISTEMA */}
          {tab === 'sistema' && (
            <>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Conexiones del sistema</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">URL n8n</label><input className="input" value={settings.system_n8n_url ?? ''} onChange={e => set('system_n8n_url', e.target.value)} placeholder="https://n8n.leymaken.com" /></div>
                  <div><label className="label">API Key n8n</label><input className="input" value={settings.n8n_api_key ?? ''} onChange={e => set('n8n_api_key', e.target.value)} /></div>
                  <div>
                    <label className="label">Moneda por defecto</label>
                    <select className="input" value={settings.system_currency ?? 'DOP'} onChange={e => set('system_currency', e.target.value)}>
                      <option value="DOP">DOP — Peso dominicano</option>
                      <option value="USD">USD — Dólar</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Zona horaria</label>
                    <select className="input" value={settings.system_timezone ?? 'America/Santo_Domingo'} onChange={e => set('system_timezone', e.target.value)}>
                      <option value="America/Santo_Domingo">America/Santo_Domingo</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-2)' }}>Webhooks n8n</p>
                  <div className="grid grid-cols-1 gap-3">
                    <div><label className="label">Factura pagada</label><input className="input" value={settings.n8n_webhook_invoice_paid ?? ''} onChange={e => set('n8n_webhook_invoice_paid', e.target.value)} placeholder="https://n8n.leymaken.com/webhook/..." /></div>
                    <div><label className="label">Nuevo lead</label><input className="input" value={settings.n8n_webhook_new_lead ?? ''} onChange={e => set('n8n_webhook_new_lead', e.target.value)} placeholder="https://n8n.leymaken.com/webhook/..." /></div>
                    <div><label className="label">Stock bajo</label><input className="input" value={settings.n8n_webhook_low_stock ?? ''} onChange={e => set('n8n_webhook_low_stock', e.target.value)} placeholder="https://n8n.leymaken.com/webhook/..." /></div>
                  </div>
                </div>
              </div>
              <SaveBar saving={saving} saved={saved} onSave={save} />
            </>
          )}

          {/* APARIENCIA */}
          {tab === 'apariencia' && (
            <>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Apariencia</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Tema</label>
                  <div className="flex gap-2">
                    {['dark','light','system'].map(t => (
                      <button key={t} onClick={() => set('appearance_theme', t)}
                        className={`px-4 py-2 rounded-lg text-sm border transition-colors ${settings.appearance_theme === t ? 'bg-emerald-600/15 border-emerald-500/25 text-emerald-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                        {t === 'dark' ? 'Oscuro' : t === 'light' ? 'Claro' : 'Sistema'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Color de acento</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'emerald', color: 'bg-emerald-500' },
                      { id: 'blue', color: 'bg-blue-500' },
                      { id: 'violet', color: 'bg-violet-500' },
                      { id: 'rose', color: 'bg-rose-500' },
                      { id: 'amber', color: 'bg-amber-500' },
                      { id: 'cyan', color: 'bg-cyan-500' },
                    ].map(c => (
                      <button key={c.id} onClick={() => set('appearance_color', c.id)}
                        className={`w-8 h-8 rounded-full ${c.color} ring-2 ring-offset-2 ring-offset-gray-900 transition-all ${settings.appearance_color === c.id ? 'ring-white' : 'ring-transparent'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <SaveBar saving={saving} saved={saved} onSave={save} />
            </>
          )}

          {/* ALERTAS */}
          {tab === 'alertas' && (
            <>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Notificaciones</h2>
              <div className="space-y-3">
                <Toggle value={!!settings.notif_container_caido} onChange={v => set('notif_container_caido', v)} label="Container Docker caído" />
                <Toggle value={!!settings.notif_n8n_error} onChange={v => set('notif_n8n_error', v)} label="Error en flujo de n8n" />
                <Toggle value={!!settings.notif_nuevo_lead} onChange={v => set('notif_nuevo_lead', v)} label="Nuevo lead en CRM" />
                <Toggle value={!!settings.notif_factura_vencida} onChange={v => set('notif_factura_vencida', v)} label="Factura vencida (+30 días)" />
                <Toggle value={!!settings.notif_nuevo_ticket} onChange={v => set('notif_nuevo_ticket', v)} label="Nuevo ticket de soporte" />
                <Toggle value={!!settings.notif_pago_recibido} onChange={v => set('notif_pago_recibido', v)} label="Pago recibido (factura pagada)" />
              </div>
              <SaveBar saving={saving} saved={saved} onSave={save} />
            </>
          )}

          {/* TELEGRAM */}
          {tab === 'telegram' && (
            <>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Alertas por Telegram</h2>
              <div className="space-y-4">
                <Toggle value={!!settings.telegram_enabled} onChange={v => set('telegram_enabled', v)} label="Habilitar alertas Telegram" />
                <div className="grid grid-cols-2 gap-4">
                  <PasswordField label="Bot Token" value={settings.telegram_bot_token ?? ''} onChange={v => set('telegram_bot_token', v)} placeholder="1234567890:ABC..." />
                  <div><label className="label">Chat ID</label><input className="input" value={settings.telegram_chat_id ?? ''} onChange={e => set('telegram_chat_id', e.target.value)} placeholder="-100123456789" /></div>
                </div>
                <div>
                  <label className="label">Severidad mínima</label>
                  <select className="input" value={settings.telegram_severity ?? 'info'} onChange={e => set('telegram_severity', e.target.value)}>
                    <option value="info">Info y superior</option>
                    <option value="warning">Warning y superior</option>
                    <option value="error">Solo errores</option>
                  </select>
                </div>
              </div>
              <SaveBar saving={saving} saved={saved} onSave={save} />
            </>
          )}

          {/* EMAIL */}
          {tab === 'email' && (
            <>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Configuración SMTP</h2>
              <div className="space-y-4">
                <Toggle value={!!settings.mail_enabled} onChange={v => set('mail_enabled', v)} label="Habilitar envío de emails" />
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Host SMTP</label><input className="input" value={settings.mail_host ?? ''} onChange={e => set('mail_host', e.target.value)} placeholder="smtp.gmail.com" /></div>
                  <div><label className="label">Puerto</label><input className="input" value={settings.mail_port ?? ''} onChange={e => set('mail_port', e.target.value)} placeholder="587" /></div>
                  <div><label className="label">Usuario</label><input className="input" value={settings.mail_username ?? ''} onChange={e => set('mail_username', e.target.value)} /></div>
                  <PasswordField label="Contraseña" value={settings.mail_password ?? ''} onChange={v => set('mail_password', v)} />
                  <div><label className="label">From address</label><input className="input" type="email" value={settings.mail_from_address ?? ''} onChange={e => set('mail_from_address', e.target.value)} /></div>
                  <div><label className="label">From name</label><input className="input" value={settings.mail_from_name ?? ''} onChange={e => set('mail_from_name', e.target.value)} /></div>
                  <div>
                    <label className="label">Encriptación</label>
                    <select className="input" value={settings.mail_encryption ?? 'tls'} onChange={e => set('mail_encryption', e.target.value)}>
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                      <option value="">Ninguna</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
                  <input className="input flex-1 max-w-xs" type="email" value={testEmailTo} onChange={e => setTestEmailTo(e.target.value)} placeholder="test@email.com" />
                  <button
                    onClick={async () => {
                      setTestEmailStatus('sending')
                      const r = await SettingsService.testEmail(testEmailTo)
                      setTestEmailStatus(r.ok ? 'ok' : 'error')
                      setTimeout(() => setTestEmailStatus('idle'), 4000)
                    }}
                    disabled={testEmailStatus === 'sending' || !testEmailTo}
                    className="btn-secondary text-xs py-1.5 flex items-center gap-2 disabled:opacity-50"
                  >
                    {testEmailStatus === 'sending' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    {testEmailStatus === 'ok' ? 'Enviado!' : testEmailStatus === 'error' ? 'Error' : 'Enviar test'}
                  </button>
                </div>
              </div>
              <SaveBar saving={saving} saved={saved} onSave={save} />
            </>
          )}

          {/* IMPRESIÓN */}
          {tab === 'impresion' && (
            <>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Configuración de documentos PDF</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tamaño de papel</label>
                  <select className="input" value={settings.print_paper_size ?? 'letter'} onChange={e => set('print_paper_size', e.target.value)}>
                    <option value="letter">Letter</option>
                    <option value="a4">A4</option>
                    <option value="legal">Legal</option>
                  </select>
                </div>
                <div>
                  <label className="label">Orientación</label>
                  <select className="input" value={settings.print_orientation ?? 'portrait'} onChange={e => set('print_orientation', e.target.value)}>
                    <option value="portrait">Vertical</option>
                    <option value="landscape">Horizontal</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Toggle value={!!settings.print_show_logo} onChange={v => set('print_show_logo', v)} label="Mostrar logo en documentos" />
                  <Toggle value={!!settings.print_show_footer} onChange={v => set('print_show_footer', v)} label="Mostrar pie de página" />
                </div>
                <div className="col-span-2"><label className="label">Texto del pie de página</label><input className="input" value={settings.print_footer_text ?? ''} onChange={e => set('print_footer_text', e.target.value)} placeholder="Gracias por su preferencia · leymaken.com" /></div>
                <div>
                  <label className="label">Color primario del documento</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-10 h-9 rounded cursor-pointer border border-gray-700 bg-transparent" value={settings.print_primary_color ?? '#059669'} onChange={e => set('print_primary_color', e.target.value)} />
                    <input className="input flex-1" value={settings.print_primary_color ?? '#059669'} onChange={e => set('print_primary_color', e.target.value)} placeholder="#059669" />
                  </div>
                </div>
              </div>
              <SaveBar saving={saving} saved={saved} onSave={save} />
            </>
          )}

          {/* USUARIOS */}
          {tab === 'usuarios' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Usuarios del hub</h2>
                <button onClick={() => setShowUserForm(true)} className="btn-primary text-xs py-1.5">
                  <Plus size={13} /> Nuevo usuario
                </button>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-emerald-400" /></div>
              ) : (
                <div className="card p-0 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="table-header">Usuario</th>
                        <th className="table-header">Rol</th>
                        <th className="table-header">Estado</th>
                        <th className="table-header"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="table-row">
                          <td className="table-cell">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{u.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{u.email}</p>
                          </td>
                          <td className="table-cell">
                            <span className={`badge ${u.role === 'admin' ? 'badge-green' : u.role === 'editor' ? 'badge-blue' : 'badge-gray'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className={`badge ${u.active ? 'badge-green' : 'badge-gray'}`}>{u.active ? 'Activo' : 'Inactivo'}</span>
                          </td>
                          <td className="table-cell">
                            <div className="flex gap-1 justify-end">
                              <button onClick={async () => {
                                const updated = await UsersService.update(u.id, { active: !u.active })
                                setUsers(prev => prev.map(x => x.id === u.id ? updated : x))
                              }} className="p-1.5 rounded-md text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                                <Edit2 size={13} />
                              </button>
                              <button onClick={async () => {
                                if (!confirm(`¿Eliminar a ${u.name}?`)) return
                                await UsersService.remove(u.id)
                                setUsers(prev => prev.filter(x => x.id !== u.id))
                              }} className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {showUserForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Nuevo usuario</h3>
                      <button onClick={() => setShowUserForm(false)} className="p-1.5 rounded-lg hover:bg-gray-800"><X size={16} className="text-gray-400" /></button>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                      <div><label className="label">Nombre</label><input className="input" value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} /></div>
                      <div><label className="label">Email</label><input className="input" type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} /></div>
                      <div><label className="label">Contraseña</label><input className="input" type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} /></div>
                      <div>
                        <label className="label">Rol</label>
                        <select className="input" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
                          <option value="viewer">Viewer — Solo lectura</option>
                          <option value="editor">Editor — Puede editar</option>
                          <option value="admin">Admin — Acceso total</option>
                        </select>
                      </div>
                      <div className="flex gap-3 pt-1">
                        <button onClick={() => setShowUserForm(false)} className="btn-secondary flex-1">Cancelar</button>
                        <button onClick={async () => {
                          setSavingUser(true)
                          try {
                            const created = await UsersService.create(userForm)
                            setUsers(prev => [created, ...prev])
                            setShowUserForm(false)
                            setUserForm({ name: '', email: '', password: '', role: 'viewer' })
                          } finally {
                            setSavingUser(false)
                          }
                        }} disabled={savingUser} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                          {savingUser && <Loader2 size={13} className="animate-spin" />}
                          {savingUser ? 'Guardando…' : 'Crear usuario'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* LOGS */}
          {tab === 'logs' && (
            <>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Registro de actividad</h2>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Los logs se muestran también en tiempo real en el ticker inferior.</p>
              <div className="card p-0 overflow-hidden">
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>Ver el ticker en tiempo real abajo en la pantalla.</p>
                </div>
              </div>
            </>
          )}

          {/* SEGURIDAD */}
          {tab === 'seguridad' && (
            <>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Cambiar contraseña</h2>
              <div className="space-y-4 max-w-sm">
                <PasswordField label="Contraseña actual" value={pwCurrent} onChange={setPwCurrent} />
                <PasswordField label="Nueva contraseña" value={pwNew} onChange={setPwNew} />
                <PasswordField label="Confirmar nueva contraseña" value={pwConfirm} onChange={setPwConfirm} />
                <button
                  disabled={!pwCurrent || !pwNew || pwNew !== pwConfirm || saving}
                  onClick={async () => {
                    setSaving(true)
                    try {
                      await api.post('/auth/change-password', { current_password: pwCurrent, new_password: pwNew })
                      setSaved(true)
                      setPwCurrent(''); setPwNew(''); setPwConfirm('')
                      setTimeout(() => setSaved(false), 3000)
                    } finally {
                      setSaving(false)
                    }
                  }}
                  className="btn-primary text-xs py-1.5 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
                  {saving ? 'Guardando…' : saved ? 'Actualizado' : 'Cambiar contraseña'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
