import { useState, useEffect } from 'react'
import { Plus, Trash2, X, Monitor, Loader2 } from 'lucide-react'
import { Tabs, TabList, Tab, TabPanel } from '@/components/Tabs'
import api from '@/lib/bizApi'

export interface DesktopRelease {
  id: number
  suite: 'commerce' | 'construction'
  version: string
  platform: 'windows-x86_64' | 'darwin-aarch64' | 'linux-x86_64'
  download_url: string
  signature: string | null
  notes: string | null
  pub_date: string | null
  is_active: boolean
  created_at: string
}

const DesktopReleasesService = {
  list: (): Promise<DesktopRelease[]> =>
    api.get('/desktop-releases').then(r => r.data.data ?? r.data),

  create: (payload: Omit<DesktopRelease, 'id' | 'created_at'>): Promise<DesktopRelease> =>
    api.post('/desktop-releases', payload).then(r => r.data.data ?? r.data),

  toggle: (id: number, is_active: boolean): Promise<DesktopRelease> =>
    api.patch(`/desktop-releases/${id}`, { is_active }).then(r => r.data.data ?? r.data),

  remove: (id: number): Promise<void> =>
    api.delete(`/desktop-releases/${id}`).then(() => undefined),
}

const SUITE_LABELS: Record<string, string> = {
  commerce:     'Commerce',
  construction: 'Construction',
}

const PLATFORM_LABELS: Record<string, string> = {
  'windows-x86_64':  'Windows x86_64',
  'darwin-aarch64':  'macOS ARM64',
  'linux-x86_64':    'Linux x86_64',
}

const BLANK_FORM = {
  suite:        'commerce' as DesktopRelease['suite'],
  version:      '',
  platform:     'windows-x86_64' as DesktopRelease['platform'],
  download_url: '',
  signature:    '',
  notes:        '',
  pub_date:     '',
  is_active:    true,
}

function Releases() {
  const [releases, setReleases]     = useState<DesktopRelease[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(BLANK_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  useEffect(() => {
    DesktopReleasesService.list()
      .then(setReleases)
      .catch(() => setError('No se pudieron cargar los releases.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        signature: form.signature || null,
        notes:     form.notes     || null,
        pub_date:  form.pub_date  || null,
      }
      const created = await DesktopReleasesService.create(payload)
      setReleases(prev => [created, ...prev])
      setForm(BLANK_FORM)
      setShowForm(false)
    } catch {
      // leave form open, user can retry
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (release: DesktopRelease) => {
    const next = !release.is_active
    setTogglingId(release.id)
    setReleases(prev => prev.map(r => r.id === release.id ? { ...r, is_active: next } : r))
    try {
      await DesktopReleasesService.toggle(release.id, next)
    } catch {
      setReleases(prev => prev.map(r => r.id === release.id ? { ...r, is_active: release.is_active } : r))
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (release: DesktopRelease) => {
    setReleases(prev => prev.filter(r => r.id !== release.id))
    try {
      await DesktopReleasesService.remove(release.id)
    } catch {
      setReleases(prev => [release, ...prev])
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--text-3)' }} />
    </div>
  )

  if (error) return (
    <div className="card text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>
      {error}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          {releases.filter(r => r.is_active).length} activos · {releases.length} totales
        </p>
        <button
          onClick={() => { setForm(BLANK_FORM); setShowForm(true) }}
          className="btn-primary text-xs py-1.5"
        >
          <Plus size={13} /> Nuevo Release
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div
            className="w-full max-w-lg rounded-2xl border overflow-hidden"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>
                Nuevo Desktop Release
              </p>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 text-gray-500 hover:text-gray-300"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto max-h-[75vh]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Suite</label>
                    <select
                      className="input"
                      value={form.suite}
                      onChange={e => setForm(f => ({ ...f, suite: e.target.value as DesktopRelease['suite'] }))}
                    >
                      <option value="commerce">Commerce</option>
                      <option value="construction">Construction</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Versión</label>
                    <input
                      required
                      className="input"
                      placeholder="1.0.0"
                      value={form.version}
                      onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="label">Plataforma</label>
                    <select
                      className="input"
                      value={form.platform}
                      onChange={e => setForm(f => ({ ...f, platform: e.target.value as DesktopRelease['platform'] }))}
                    >
                      <option value="windows-x86_64">Windows x86_64</option>
                      <option value="darwin-aarch64">macOS ARM64</option>
                      <option value="linux-x86_64">Linux x86_64</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Fecha publicación</label>
                    <input
                      type="date"
                      className="input"
                      value={form.pub_date}
                      onChange={e => setForm(f => ({ ...f, pub_date: e.target.value }))}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="label">URL de descarga</label>
                    <input
                      required
                      className="input"
                      placeholder="https://..."
                      value={form.download_url}
                      onChange={e => setForm(f => ({ ...f, download_url: e.target.value }))}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="label">Firma (signature)</label>
                    <textarea
                      rows={3}
                      className="input resize-none"
                      placeholder="dW50cnVzdGVkIGNvbW1lbnQ..."
                      value={form.signature}
                      onChange={e => setForm(f => ({ ...f, signature: e.target.value }))}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="label">Notas</label>
                    <textarea
                      rows={2}
                      className="input resize-none"
                      placeholder="Changelog, mejoras..."
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    />
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      id="is_active"
                      type="checkbox"
                      className="w-4 h-4 rounded accent-emerald-500"
                      checked={form.is_active}
                      onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    />
                    <label htmlFor="is_active" className="text-xs" style={{ color: 'var(--text-2)' }}>
                      Activo al publicar
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1">
                    {submitting
                      ? <Loader2 size={13} className="animate-spin" />
                      : 'Crear release'
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {releases.length === 0 ? (
        <div className="card text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>
          No hay releases registrados.
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="table-header text-left px-5 py-3">Suite</th>
                  <th className="table-header text-left px-5 py-3">Versión</th>
                  <th className="table-header text-left px-5 py-3">Plataforma</th>
                  <th className="table-header text-left px-5 py-3">URL</th>
                  <th className="table-header text-left px-5 py-3">Activo</th>
                  <th className="table-header text-left px-5 py-3">Fecha pub.</th>
                  <th className="table-header text-right px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {releases.map(release => (
                  <tr key={release.id} className="table-row" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="table-cell px-5 py-3 font-medium">
                      {SUITE_LABELS[release.suite] ?? release.suite}
                    </td>
                    <td className="table-cell px-5 py-3 font-mono text-xs">
                      v{release.version}
                    </td>
                    <td className="table-cell px-5 py-3">
                      <span className="text-xs" style={{ color: 'var(--text-2)' }}>
                        {PLATFORM_LABELS[release.platform] ?? release.platform}
                      </span>
                    </td>
                    <td className="table-cell px-5 py-3 max-w-[180px]">
                      <a
                        href={release.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 truncate block"
                        title={release.download_url}
                      >
                        {release.download_url}
                      </a>
                    </td>
                    <td className="table-cell px-5 py-3">
                      <span className={`badge ${release.is_active ? 'badge-green' : 'badge-red'}`}>
                        {release.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="table-cell px-5 py-3 text-xs font-mono" style={{ color: 'var(--text-3)' }}>
                      {release.pub_date ?? '—'}
                    </td>
                    <td className="table-cell px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggle(release)}
                          disabled={togglingId === release.id}
                          className={`p-1.5 rounded-md transition-colors ${
                            release.is_active
                              ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                              : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={release.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {togglingId === release.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <X size={13} />
                          }
                        </button>
                        <button
                          onClick={() => handleDelete(release)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Eliminar release"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DesktopPage() {
  return (
    <Tabs defaultTab="releases">
      <TabList>
        <Tab id="releases" label="Releases" icon={<Monitor size={14} />} />
      </TabList>
      <TabPanel id="releases">
        <Releases />
      </TabPanel>
    </Tabs>
  )
}
