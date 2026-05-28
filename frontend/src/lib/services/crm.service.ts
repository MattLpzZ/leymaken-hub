import api from '@/lib/bizApi'

export interface CrmLead {
  id: number
  name: string
  email?: string
  phone?: string
  company?: string
  source: string
  status: string
  notes?: string
  created_at?: string
}

export interface CrmDeal {
  id: number
  client_name: string
  service?: string
  amount: number
  probability: number
  stage: string
  notes?: string
  lead_id?: number
  created_at?: string
}

export const CrmLeadsService = {
  list:   ()                                       => api.get<CrmLead[]>('/crm-leads').then(r => r.data),
  create: (data: Partial<CrmLead>)                 => api.post<CrmLead>('/crm-leads', data).then(r => r.data),
  update: (id: number, data: Partial<CrmLead>)     => api.put<CrmLead>(`/crm-leads/${id}`, data).then(r => r.data),
  remove: (id: number)                             => api.delete(`/crm-leads/${id}`),
}

export const CrmDealsService = {
  list:    ()                                       => api.get<CrmDeal[]>('/crm-deals').then(r => r.data),
  create:  (data: Partial<CrmDeal>)                 => api.post<CrmDeal>('/crm-deals', data).then(r => r.data),
  update:  (id: number, data: Partial<CrmDeal>)     => api.put<CrmDeal>(`/crm-deals/${id}`, data).then(r => r.data),
  advance: (id: number)                             => api.patch<CrmDeal>(`/crm-deals/${id}/advance`).then(r => r.data),
  retreat: (id: number)                             => api.patch<CrmDeal>(`/crm-deals/${id}/retreat`).then(r => r.data),
  remove:  (id: number)                             => api.delete(`/crm-deals/${id}`),
}
