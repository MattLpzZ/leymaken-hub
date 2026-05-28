import api from '@/lib/api'

export interface ClientService {
  id: number
  client_id: number
  type: 'suite' | 'automation' | 'project' | 'ubicado'
  name: string
  status: 'pending' | 'active' | 'paused' | 'cancelled'
  monthly_value: number
  start_date?: string
  notes?: string
  meta?: Record<string, unknown>
}

export interface Client {
  id: number
  name: string
  email?: string
  phone?: string
  company_name?: string
  rnc?: string
  address?: string
  notes?: string
  status: 'prospect' | 'active' | 'inactive'
  services: ClientService[]
  mrr: number
  created_at: string
}

export const ClientsService = {
  list: () => api.get<Client[]>('/clients').then(r => r.data),
  get:  (id: number) => api.get<Client>(`/clients/${id}`).then(r => r.data),
  create: (data: Partial<Client>) => api.post<Client>('/clients', data).then(r => r.data),
  update: (id: number, data: Partial<Client>) => api.put<Client>(`/clients/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/clients/${id}`),

  addService:    (clientId: number, data: Partial<ClientService>) =>
    api.post<ClientService>(`/clients/${clientId}/services`, data).then(r => r.data),
  updateService: (clientId: number, serviceId: number, data: Partial<ClientService>) =>
    api.patch<ClientService>(`/clients/${clientId}/services/${serviceId}`, data).then(r => r.data),
  removeService: (clientId: number, serviceId: number) =>
    api.delete(`/clients/${clientId}/services/${serviceId}`),
  generateInvoice: (clientId: number) =>
    api.post(`/clients/${clientId}/generate-invoice`).then(r => r.data),
}
