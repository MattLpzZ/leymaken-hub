import api from '@/lib/bizApi'
import type { Client } from './clients.service'

export interface InvoiceItem {
  description: string
  qty: number
  unit_price: number
}

export interface Invoice {
  id: number
  client_id: number
  client?: Client
  number: string
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  paid_at?: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  currency: string
  notes?: string
  public_token?: string | null
}

export const InvoicesService = {
  list: (params?: { status?: string; client_id?: number }) =>
    api.get<Invoice[]>('/invoices', { params }).then(r => r.data),

  get: (id: number) =>
    api.get<Invoice>(`/invoices/${id}`).then(r => r.data),

  create: (data: Partial<Invoice>) =>
    api.post<Invoice>('/invoices', data).then(r => r.data),

  update: (id: number, data: Partial<Invoice>) =>
    api.put<Invoice>(`/invoices/${id}`, data).then(r => r.data),

  markPaid: (id: number) =>
    api.patch<Invoice>(`/invoices/${id}/mark-paid`).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/invoices/${id}`),

  print: (id: number) =>
    api.get<string>(`/invoices/${id}/print`, {
      responseType: 'text',
      headers: { Accept: 'text/html' },
    }).then(r => r.data),

  exportUrl: () => `${api.defaults.baseURL}/invoices/export`,
}
