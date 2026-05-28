import { useState, useEffect } from 'react'
import { Plus, CheckCircle, XCircle, Clock, FileText, Copy, X, Trash2, Loader2, Download, Mail } from 'lucide-react'
import api from '@/lib/bizApi'
import Badge from '@/components/Badge'
import Pagination from '@/components/Pagination'
import StatCard from '@/components/StatCard'
import { DollarSign } from 'lucide-react'
import { QuotesService, type Quote, type QuoteItem } from '@/lib/services/quotes.service'
import { ClientsService, type Client } from '@/lib/services/clients.service'

const PER_PAGE = 5

const statusMap: Record<string, { label: string; color: 'green'|'amber'|'red'|'gray'; icon: React.ElementType }> = {
  pending:  { label: 'Pendiente', color: 'amber', icon: Clock },
  approved: { label: 'Aprobada',  color: 'green', icon: CheckCircle },
  rejected: { label: 'Rechazada', color: 'red',   icon: XCircle },
  expired:  { label: 'Vencida',   color: 'gray',  icon: XCircle },
}

const BLANK_ITEM: QuoteItem = { description: '', qty: 1, unit_price: 0 }

export default function Quotes() {
  const [quotes, setQuotes]     = useState<Quote[]>([])
  const [clients, setClients]   = useState<Client[]>([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [converting, setConverting] = useState<number | null>(null)

  // Email modal
  const [emailTarget, setEmailTarget]   = useState<Quote | null>(null)
  const [emailAddr, setEmailAddr]       = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailDone, setEmailDone]       = useState(false)
  const [form, setForm] = useState({
    client_id: '', number: '', issue_date: new Date().toISOString().slice(0,10),
    expires_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0,10),
    currency: 'DOP', notes: '',
    items: [{ ...BLANK_ITEM }] as QuoteItem[],
  })

  useEffect(() => {
    Promise.all([QuotesService.list(), ClientsService.list()])
      .then(([q, c]) => { setQuotes(q); setClients(c) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const subtotal = form.items.reduce((a, i) => a + i.qty * i.unit_price, 0)
  const tax      = Math.round(subtotal * 0.18 * 100) / 100
  const total    = subtotal + tax

  const openForm = () => {
    const next = quotes.length + 1
    setForm(f => ({ ...f, number: `COT-${String(next).padStart(4,'0')}`, items: [{ ...BLANK_ITEM }] }))
    setShowForm(true)
  }

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...BLANK_ITEM }] }))
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const setItem = (i: number, field: keyof QuoteItem, val: string) =>
    setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: field === 'description' ? val : Number(val) } : item) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await QuotesService.create({
        ...form,
        client_id: Number(form.client_id),
        subtotal, tax, total,
      })
      setQuotes(prev => [created, ...prev])
      setShowForm(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (q: Quote, status: Quote['status']) => {
    const updated = await QuotesService.update(q.id, { status })
    setQuotes(prev => prev.map(x => x.id === q.id ? updated : x))
  }

  const convert = async (q: Quote) => {
    setConverting(q.id)
    try {
      const { quote } = await QuotesService.convert(q.id)
      setQuotes(prev => prev.map(x => x.id === q.id ? quote : x))
    } catch (err) {
      console.error(err)
    } finally {
      setConverting(null)
    }
  }

  const remove = async (q: Quote) => {
    if (!confirm(`¿Eliminar cotización ${q.number}?`)) return
    await QuotesService.remove(q.id)
    setQuotes(prev => prev.filter(x => x.id !== q.id))
  }

  const handleDownload = async (id: number) => {
    const html = await QuotesService.print(id)
    const win = window.open('', '_blank', 'width=900,height=700')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => win.print(), 600)
    }
  }

  const handleExport = async () => {
    const { data } = await api.get('/quotes/export', { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url; a.download = 'cotizaciones.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const openEmailModal = (q: Quote) => {
    setEmailTarget(q)
    setEmailAddr(q.client?.email ?? '')
    setEmailDone(false)
  }

  const handleSendEmail = async () => {
    if (!emailTarget || !emailAddr) return
    setEmailSending(true)
    try {
      await api.post(`/quotes/${emailTarget.id}/send-email`, { email: emailAddr })
      setEmailDone(true)
    } catch {
      // ignore
    } finally {
      setEmailSending(false)
    }
  }

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 size={24} className="animate-spin text-emerald-400" /></div>

  const paginated  = quotes.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalValue = quotes.filter(q => q.status === 'approved').reduce((a, q) => a + Number(q.total), 0)

  return (
    <div className="space-y-5">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total cotizaciones" value={quotes.length}                                         icon={FileText}    color="bg-blue-600" />
        <StatCard title="Pendientes"          value={quotes.filter(q=>q.status==='pending').length}        icon={Clock}       color="bg-amber-600" />
        <StatCard title="Aprobadas"           value={quotes.filter(q=>q.status==='approved').length}       icon={CheckCircle} color="bg-emerald-600" />
        <StatCard title="Valor aprobado"      value={`RD$ ${totalValue.toLocaleString()}`}                 icon={DollarSign}  color="bg-purple-600" />
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn-secondary text-xs py-1.5" onClick={handleExport}>
          <Download size={13} /> Exportar CSV
        </button>
        <button onClick={openForm} className="btn-primary text-xs py-1.5">
          <Plus size={13} /> Nueva Cotización
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header w-10"></th>
              <th className="table-header">N°</th>
              <th className="table-header">Cliente</th>
              <th className="table-header">Fecha</th>
              <th className="table-header">Vence</th>
              <th className="table-header text-right">Monto</th>
              <th className="table-header">Estado</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((q) => {
              const st = statusMap[q.status]
              return (
                <tr key={q.id} className="table-row">
                  <td className="table-cell">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      q.status === 'approved' ? 'bg-emerald-500/10' : q.status === 'pending' ? 'bg-amber-500/10' : 'bg-red-500/10'
                    }`}>
                      <st.icon size={14} className={q.status === 'approved' ? 'text-emerald-400' : q.status === 'pending' ? 'text-amber-400' : 'text-red-400'} />
                    </div>
                  </td>
                  <td className="table-cell font-mono text-xs" style={{ color: 'var(--text-3)' }}>{q.number}</td>
                  <td className="table-cell">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{q.client?.name ?? '—'}</p>
                  </td>
                  <td className="table-cell text-xs" style={{ color: 'var(--text-3)' }}>{q.issue_date?.toString().slice(0,10)}</td>
                  <td className="table-cell text-xs" style={{ color: 'var(--text-3)' }}>{q.expires_date?.toString().slice(0,10)}</td>
                  <td className="table-cell text-right font-mono text-sm font-semibold text-emerald-400">
                    RD$ {Number(q.total).toLocaleString()}
                  </td>
                  <td className="table-cell">
                    <Badge variant={st.color}>{st.label}</Badge>
                    {q.converted_invoice_id && <span className="ml-1 text-[10px] text-blue-400">→ Factura</span>}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1 justify-end">
                      {q.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(q, 'approved')} className="p-1.5 rounded-md text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Aprobar"><CheckCircle size={13} /></button>
                          <button onClick={() => updateStatus(q, 'rejected')} className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Rechazar"><XCircle size={13} /></button>
                        </>
                      )}
                      {q.status === 'approved' && !q.converted_invoice_id && (
                        <button onClick={() => convert(q)} disabled={converting === q.id} className="p-1.5 rounded-md text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors" title="Convertir a factura">
                          {converting === q.id ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
                        </button>
                      )}
                      <button onClick={() => handleDownload(q.id)} className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors" title="Descargar PDF"><Download size={13} /></button>
                      <button onClick={() => openEmailModal(q)} className="p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Enviar por email"><Mail size={13} /></button>
                      <button onClick={() => remove(q)} className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Eliminar"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {quotes.length === 0 && (
              <tr><td colSpan={8} className="table-cell text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>Sin cotizaciones</td></tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} total={quotes.length} perPage={PER_PAGE} onChange={setPage} />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Nueva Cotización</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"><X size={16} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Cliente</label>
                  <select required className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">N° Cotización</label>
                  <input required className="input" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Fecha emisión</label>
                  <input required type="date" className="input" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Fecha vencimiento</label>
                  <input required type="date" className="input" value={form.expires_date} onChange={e => setForm(f => ({ ...f, expires_date: e.target.value }))} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Servicios / Ítems</label>
                  <button type="button" onClick={addItem} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"><Plus size={12} /> Agregar línea</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input required className="input col-span-6 text-xs" placeholder="Descripción del servicio" value={item.description} onChange={e => setItem(i, 'description', e.target.value)} />
                      <input required type="number" min="1" className="input col-span-2 text-xs" placeholder="Cant." value={item.qty} onChange={e => setItem(i, 'qty', e.target.value)} />
                      <input required type="number" min="0" className="input col-span-3 text-xs" placeholder="Precio" value={item.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)} />
                      <button type="button" onClick={() => removeItem(i)} disabled={form.items.length === 1} className="col-span-1 p-1 rounded text-gray-600 hover:text-red-400 disabled:opacity-30 transition-colors"><X size={13} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-800 pt-3 space-y-1 text-xs text-right" style={{ color: 'var(--text-3)' }}>
                <p>Subtotal: <span className="font-mono" style={{ color: 'var(--text-2)' }}>RD$ {subtotal.toLocaleString()}</span></p>
                <p>ITBIS 18%: <span className="font-mono" style={{ color: 'var(--text-2)' }}>RD$ {tax.toLocaleString()}</span></p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Total: <span className="text-emerald-400">RD$ {total.toLocaleString()}</span></p>
              </div>

              <div>
                <label className="label">Notas (opcional)</label>
                <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </form>
            <div className="px-6 py-4 border-t border-gray-800 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSubmit as any} disabled={saving} className="btn-primary disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? 'Guardando…' : 'Crear cotización'}
              </button>
            </div>
          </div>
        </div>
      )}

      {emailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-100">Enviar cotización por email</h3>
              <button onClick={() => setEmailTarget(null)} className="p-1.5 rounded-lg hover:bg-gray-800"><X size={15} className="text-gray-400" /></button>
            </div>
            {emailDone ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle size={32} className="text-emerald-400" />
                <p className="text-sm text-gray-300">Enviado a <strong>{emailAddr}</strong></p>
                <button onClick={() => setEmailTarget(null)} className="btn-primary text-xs py-1.5 w-full">Cerrar</button>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400">Cotización <strong className="text-gray-200">{emailTarget.number}</strong> · {emailTarget.client?.name}</p>
                <div>
                  <label className="label">Correo destino</label>
                  <input className="input" type="email" value={emailAddr} onChange={e => setEmailAddr(e.target.value)} placeholder="cliente@email.com" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEmailTarget(null)} className="btn-secondary text-xs py-1.5 flex-1">Cancelar</button>
                  <button onClick={handleSendEmail} disabled={emailSending || !emailAddr} className="btn-primary text-xs py-1.5 flex-1 disabled:opacity-60">
                    {emailSending ? <Loader2 size={13} className="animate-spin" /> : <><Mail size={13} /> Enviar</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
