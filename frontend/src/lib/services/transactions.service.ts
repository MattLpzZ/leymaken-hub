import api from '@/lib/api'

export interface Transaction {
  id: number
  type: 'income' | 'expense'
  description: string
  amount: number
  category: string
  date: string
  client_id?: number
  account?: string
  reference?: string
  notes?: string
}

export interface MonthlySummary {
  month: number
  income: number
  expense: number
  balance: number
}

export const TransactionsService = {
  list: (params?: { type?: string; category?: string; month?: number; year?: number }) =>
    api.get<Transaction[]>('/transactions', { params }).then((r) => r.data),

  create: (data: Partial<Transaction>) =>
    api.post<Transaction>('/transactions', data).then((r) => r.data),

  update: (id: number, data: Partial<Transaction>) =>
    api.put<Transaction>(`/transactions/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/transactions/${id}`),

  monthlySummary: (year?: number) =>
    api.get<MonthlySummary[]>('/transactions/summary/monthly', { params: { year } }).then((r) => r.data),
}
