import { useState, useEffect } from 'react'
import {
  Plus, Eye, Download, CheckCircle, Clock, XCircle,
  FileText, AlertCircle, Loader2, Trash2, X, Mail, Link2,
} from 'lucide-react'
import Badge from '@/components/Badge'
import Pagination from '@/components/Pagination'
import StatCard from '@/components/StatCard'
import api from '@/lib/bizApi'
import { InvoicesService, type Invoice, type InvoiceItem } from '@/lib/services/invoices.service'
import { ClientsService, type Client } from '@/lib/services/clients.service'

const PER_PAGE = 5

const statusMap: Record<string, { label: string; color: 'green' | 'amber' | 'red' | 'blue' | 'gray'; icon: React.ElementType }> = {
  paid:      { label: 'Pagada',       color: 'green', icon: CheckCircle },
  pending:   { label: 'Pendiente',    color: 'amber', icon: Clock },
  overdue:   { label: 'Vencida',      color: 'red',   icon: XCircle },
  cancelled: { label: 'Cancelada',    color: 'gray',  icon: XCircle },
}

interface NewInvoiceForm {
  client_id: string
  number: string
  issue_date: string
  due_date: string
  currency: string
  notes: string
  items: InvoiceItem[]
}

const DEFAULT_FORM: NewInvoiceForm = {
  client_id: '',
  number: '',
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  currency: 'DOP',
  notes: '',
  items: [{ description: '', qty: 1, unit_price: 0 }],
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients]   = useState<Client[]>([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)

  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState<NewInvoiceForm>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [emailTarget, setEmailTarget]   = useState<Invoice | null>(null)
  const [emailAddr, setEmailAddr]       = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailDone, setEmailDone]       = useState(false)

  useEffect(() => {
    Promise.all([InvoicesService.list(), ClientsService.list()])
      .then(([inv, cli]) => {
        setInvoices(inv)
        setClients(cli)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.total, 0)
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((a, i) => a + i.total, 0)
  const overdue      = invoices.filter(i => i.status === 'overdue').length

  const paginated = invoices.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleMarkPaid = async (id: number) => {
    const updated = await InvoicesService.markPaid(id)
    setInvoices(prev => prev.map(inv => inv.id === id ? updated : inv))
  }

  const handleRemove = (id: number) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id))
    InvoicesService.remove(id).catch(() => {
      InvoicesService.list().then(setInvoices)
    })
  }

  const handleDownload = async (id: number) => {
    const html = await InvoicesService.print(id)
    const win = window.open('', '_blank', 'width=900,height=700')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => win.print(), 600)
    }
  }

  const openEmailModal = (inv: Invoice) => {
    setEmailTarget(inv)
    setEmailAddr(inv.client?.email ?? '')
    setEmailDone(false)
  }

  const handleSendEmail = async () => {
    if (!emailTarget || !emailAddr) return
    setEmailSending(true)
    try {
      await api.post(`/invoices/${emailTarget.id}/send-email`, { email: emailAddr })
      setEmailDone(true)
    } catch {
      // ignore — user can retry
    } finally {
      setEmailSending(false)
    }
  }

  const copyLink = (inv: Invoice) => {
    if (!inv.public_token) return
    const base = (import.meta.env.VITE_API_URL ?? 'https://api.leymaken.com').replace(/\/api$/, '')
    const url = `${base}/public/invoices/${inv.public_token}`
    navigator.clipboard.writeText(url)
  }

  const handleExport = async () => {
    const { data } = await api.get('/invoices/export', { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url; a.download = 'facturas.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setForm(prev => {
      const items = [...prev.items]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, items }
    })
  }

  const addItem = () =>
    setForm(prev => ({ ...prev, items: [...prev.items, { description: '', qty: 1, unit_price: 0 }] }))

  const removeItem = (index: number) =>
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))

  const calcSubtotal = () =>
    form.items.reduce((a, item) => a + item.qty * item.unit_price, 0)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_id) return
    setSubmitting(true)
    try {
      const subtotal = calcSubtotal()
      const tax = Math.round(subtotal * 0.18)
      const created = await InvoicesService.create({
        client_id: Number(form.client_id),
        number: form.number,
        issue_date: form.issue_date,
        due_date: form.due_date,
        currency: form.currency,
        notes: form.notes || undefined,
        items: form.items,
        subtotal,
        tax,
        total: subtotal + tax,
        status: 'pending',
      })
      setInvoices(prev => [created, ...prev])
      setForm(DEFAULT_FORM)
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total facturas" value={invoices.length}                         icon={FileText}    color="bg-blue-600" />
        <StatCard title="Cobrado"         value={`RD$ ${totalPaid.toLocaleString()}`}    icon={CheckCircle} color="bg-emerald-600" />
        <StatCard title="Por cobrar"      value={`RD$ ${totalPending.toLocaleString()}`} icon={Clock}       color="bg-amber-600" />
        <StatCard title="Vencidas"        value={overdue}                                icon={AlertCircle} color="bg-red-600" />
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn-secondary text-xs py-1.5" onClick={handleExport}>
          <Download size={13} /> Exportar CSV
        </button>
        <button className="btn-primary text-xs py-1.5" onClick={() => setShowForm(v => !v)}>
          <Plus size={13} /> Nueva Factura
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Nueva Factura</h3>
              <button onClick={() => { setShowForm(false); setForm(DEFAULT_FORM) }} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Cliente *</label>
                  <select className="input" value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} required>
                    <option value="">Seleccionar cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">N° Factura *</label>
                  <input className="input" placeholder="FAC-001" value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Fecha emisión</label>
                  <input type="date" className="input" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Fecha vencimiento *</label>
                  <input type="date" className="input" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Moneda</label>
                  <select className="input" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                    <option value="DOP">DOP</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="label">Notas</label>
                  <input className="input" placeholder="Opcional..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Conceptos</label>
                  <button type="button" onClick={addItem} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                    <Plus size={12} /> Agregar línea
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input className="input text-xs col-span-6" placeholder="Descripción" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} required />
                      <input type="number" className="input text-xs col-span-2" placeholder="Qty" min={1} value={item.qty} onChange={e => handleItemChange(idx, 'qty', Number(e.target.value))} />
                      <input type="number" className="input text-xs col-span-3" placeholder="Precio" min={0} value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', Number(e.target.value))} />
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="col-span-1 p-1 rounded text-gray-600 hover:text-red-400 transition-colors"><X size={13} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-800 pt-3 text-xs text-right space-y-1" style={{ color: 'var(--text-3)' }}>
                <p>Subtotal: <span className="font-mono" style={{ color: 'var(--text-2)' }}>RD$ {calcSubtotal().toLocaleString()}</span></p>
                <p>ITBIS 18%: <span className="font-mono" style={{ color: 'var(--text-2)' }}>RD$ {Math.round(calcSubtotal() * 0.18).toLocaleString()}</span></p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Total: <span className="text-emerald-400">RD$ {Math.round(calcSubtotal() * 1.18).toLocaleString()}</span></p>
              </div>
            </form>
            <div className="px-6 py-4 border-t border-gray-800 flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setForm(DEFAULT_FORM) }} className="btn-secondary">Cancelar</button>
              <button onClick={handleCreate as any} disabled={submitting} className="btn-primary disabled:opacity-50 flex items-center gap-2">
                {submitting && <Loader2 size={13} className="animate-spin" />}
                {submitting ? 'Guardando…' : 'Crear factura'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText size={32} className="text-gray-600" />
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>No hay facturas. Crea la primera.</p>
          </div>
        ) : (
          <>
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
                {paginated.map((inv) => {
                  const st = statusMap[inv.status] ?? statusMap['pending']
                  const IconComp = st.icon
                  return (
                    <tr key={inv.id} className="table-row">
                      <td className="table-cell">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          inv.status === 'paid'      ? 'bg-emerald-500/10' :
                          inv.status === 'overdue'   ? 'bg-red-500/10' :
                          inv.status === 'cancelled' ? 'bg-gray-500/10' : 'bg-amber-500/10'
                        }`}>
                          <IconComp size={14} className={
                            inv.status === 'paid'      ? 'text-emerald-400' :
                            inv.status === 'overdue'   ? 'text-red-400' :
                            inv.status === 'cancelled' ? 'text-gray-400' : 'text-amber-400'
                          } />
                        </div>
                      </td>
                      <td className="table-cell font-mono text-xs" style={{ color: 'var(--text-3)' }}>
                        {inv.number}
                      </td>
                      <td className="table-cell">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                          {inv.client?.name ?? `Cliente #${inv.client_id}`}
                        </p>
                      </td>
                      <td className="table-cell text-xs" style={{ color: 'var(--text-3)' }}>{inv.issue_date}</td>
                      <td className="table-cell text-xs" style={{ color: inv.status === 'overdue' ? '#f87171' : 'var(--text-3)' }}>
                        {inv.due_date}
                      </td>
                      <td className="table-cell text-right font-mono text-sm font-semibold text-emerald-400">
                        {inv.currency} {inv.total.toLocaleString()}
                      </td>
                      <td className="table-cell">
                        <Badge variant={st.color}>{st.label}</Badge>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1 justify-end">
                          <button
                            className="p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Ver"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                            title="Descargar PDF"
                            onClick={() => handleDownload(inv.id)}
                          >
                            <Download size={13} />
                          </button>
                          <button
                            className="p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Enviar por email"
                            onClick={() => openEmailModal(inv)}
                          >
                            <Mail size={13} />
                          </button>
                          {inv.public_token && (
                            <button
                              className="p-1.5 rounded-md text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Copiar enlace de cliente"
                              onClick={() => copyLink(inv)}
                            >
                              <Link2 size={13} />
                            </button>
                          )}
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <button
                              className="p-1.5 rounded-md text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Marcar pagada"
                              onClick={() => handleMarkPaid(inv.id)}
                            >
                              <CheckCircle size={13} />
                            </button>
                          )}
                          <button
                            className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Eliminar"
                            onClick={() => handleRemove(inv.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination page={page} total={invoices.length} perPage={PER_PAGE} onChange={setPage} />
          </>
        )}
      </div>

      {emailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-100">Enviar factura por email</h3>
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
                <p className="text-xs text-gray-400">Factura <strong className="text-gray-200">{emailTarget.number}</strong> · {emailTarget.client?.name}</p>
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
