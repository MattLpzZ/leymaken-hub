import api from '@/lib/bizApi'

export interface Client {
  id: number
  name: string
  email?: string
  phone?: string
  company?: string
  type: 'saas' | 'freelance' | 'project'
  plan?: string
  monthly_fee?: number
  billing_day?: number
  notes?: string
}

export const ClientsService = {
  list: (search?: string) =>
    api.get<Client[]>('/clients', { params: { search } }).then(r => r.data),

  get: (id: number) =>
    api.get<Client>(`/clients/${id}`).then(r => r.data),

  create: (data: Partial<Client>) =>
    api.post<Client>('/clients', data).then(r => r.data),

  update: (id: number, data: Partial<Client>) =>
    api.put<Client>(`/clients/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/clients/${id}`),
}
