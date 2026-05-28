import api from '@/lib/bizApi'

export interface ScheduledTransaction {
  id: number
  description: string
  category: string
  amount: number
  type: 'income' | 'expense'
  account: 'personal' | 'brand'
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly'
  next_date: string
  day_of_month: number | null
  active: boolean
}

type CreateInput = Omit<ScheduledTransaction, 'id'>

export const ScheduledService = {
  list:    () => api.get<ScheduledTransaction[]>('/scheduled-transactions').then(r => r.data),
  create:  (data: CreateInput) => api.post<ScheduledTransaction>('/scheduled-transactions', data).then(r => r.data),
  update:  (id: number, data: Partial<CreateInput>) => api.put<ScheduledTransaction>(`/scheduled-transactions/${id}`, data).then(r => r.data),
  toggle:  (id: number) => api.patch<ScheduledTransaction>(`/scheduled-transactions/${id}/toggle`).then(r => r.data),
  delete:  (id: number) => api.delete(`/scheduled-transactions/${id}`),
  execute: (id: number) => api.post<ScheduledTransaction>(`/scheduled-transactions/${id}/execute`).then(r => r.data),
}
