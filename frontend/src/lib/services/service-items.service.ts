import api from '@/lib/bizApi'

export interface ServiceItem {
  id: number
  name: string
  category: string
  price: number
  unit: string
  description?: string
  active: boolean
}

export const ServiceItemsService = {
  list: () =>
    api.get<ServiceItem[]>('/service-items').then(r => r.data),

  create: (data: Omit<ServiceItem, 'id' | 'active'>) =>
    api.post<ServiceItem>('/service-items', data).then(r => r.data),

  update: (id: number, data: Partial<ServiceItem>) =>
    api.put<ServiceItem>(`/service-items/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/service-items/${id}`),
}
