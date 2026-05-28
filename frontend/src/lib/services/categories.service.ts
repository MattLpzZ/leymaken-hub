import api from '@/lib/bizApi'

export interface InvoiceCategory {
  id: number
  name: string
  color: 'blue' | 'green' | 'purple' | 'cyan' | 'amber' | 'gray' | 'red'
  description: string | null
  created_at?: string
  updated_at?: string
}

export const CategoriesService = {
  list: (): Promise<InvoiceCategory[]> =>
    api.get('/invoice-categories').then(r => r.data),

  create: (data: Omit<InvoiceCategory, 'id' | 'created_at' | 'updated_at'>): Promise<InvoiceCategory> =>
    api.post('/invoice-categories', data).then(r => r.data),

  update: (id: number, data: Partial<Omit<InvoiceCategory, 'id' | 'created_at' | 'updated_at'>>): Promise<InvoiceCategory> =>
    api.put(`/invoice-categories/${id}`, data).then(r => r.data),

  remove: (id: number): Promise<void> =>
    api.delete(`/invoice-categories/${id}`).then(() => undefined),
}
