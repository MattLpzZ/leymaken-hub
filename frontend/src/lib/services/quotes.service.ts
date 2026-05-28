import api from '@/lib/api'
import type { Client } from './clients.service'

export interface QuoteItem {
  description: string
  qty: number
  unit_price: number
}

export interface Quote {
  id: number
  client_id: number
  client?: Client
  number: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  issue_date: string
  expires_date: string
  items: QuoteItem[]
  subtotal: number
  tax: number
  total: number
  currency: string
  converted_invoice_id?: number | null
  notes?: string
}

export const QuotesService = {
  list: (params?: { status?: string; client_id?: number }) =>
    api.get<Quote[]>('/quotes', { params }).then(r => r.data),

  get: (id: number) =>
    api.get<Quote>(`/quotes/${id}`).then(r => r.data),

  create: (data: Partial<Quote>) =>
    api.post<Quote>('/quotes', data).then(r => r.data),

  update: (id: number, data: Partial<Quote>) =>
    api.put<Quote>(`/quotes/${id}`, data).then(r => r.data),

  convert: (id: number) =>
    api.post<{ quote: Quote; invoice: unknown }>(`/quotes/${id}/convert`).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/quotes/${id}`),

  print: (id: number) =>
    api.get<string>(`/quotes/${id}/print`, {
      responseType: 'text',
      headers: { Accept: 'text/html' },
    }).then(r => r.data),

  exportUrl: () => `${api.defaults.baseURL}/quotes/export`,
}
