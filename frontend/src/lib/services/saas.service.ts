import api from '@/lib/api'

export interface SaasModule {
  key: string
  label: string
}

export interface SaasSuite {
  id: number
  key: string
  label: string
  icon: string
  modules: SaasModule[]
  active: boolean
}

export interface SaasPlan {
  id: number
  name: string
  price: number
  cycle: 'monthly' | 'annual'
  max_users: number
  description?: string
  modules?: string[]
  active: boolean
  companies_count?: number
}

export interface SaasCompany {
  id: number
  name: string
  subdomain: string
  plan_id?: number
  plan?: SaasPlan
  status: 'trial' | 'active' | 'suspended' | 'cancelled'
  trial_ends_at?: string
  subscription_ends_at?: string
  users_count?: number
  contact_email?: string
  contact_phone?: string
  notes?: string
  active_suites?: string[]
  admin_user?: { id: number; name: string; email: string; role: string }
}

export interface CompanyUser {
  id: number
  name: string
  email: string
  role: string
  active: boolean
  last_login_at?: string
}

export interface ApiKey {
  id: number
  label: string
  key_prefix: string
  key_display: string
  company_id: number
  active: boolean
  kill_switch: boolean
  environment: 'production' | 'sandbox'
  last_used_at?: string
  requests_count: number
  notes?: string
}

export const SaasPlansService = {
  list:   ()                                      => api.get<SaasPlan[]>('/suite/plans').then(r => r.data),
  create: (data: Partial<SaasPlan>)               => api.post<SaasPlan>('/suite/plans', data).then(r => r.data),
  update: (id: number, data: Partial<SaasPlan>)   => api.put<SaasPlan>(`/suite/plans/${id}`, data).then(r => r.data),
  remove: (id: number)                            => api.delete(`/suite/plans/${id}`),
}

export const SaasSuitesService = {
  list:   ()                                      => api.get<SaasSuite[]>('/suite/suites').then(r => r.data),
  create: (data: Partial<SaasSuite>)              => api.post<SaasSuite>('/suite/suites', data).then(r => r.data),
  update: (id: number, data: Partial<SaasSuite>)  => api.put<SaasSuite>(`/suite/suites/${id}`, data).then(r => r.data),
  remove: (id: number)                            => api.delete(`/suite/suites/${id}`),
}

export const SaasCompaniesService = {
  list:          ()                                          => api.get<SaasCompany[]>('/suite/companies').then(r => r.data),
  get:           (id: number)                               => api.get<SaasCompany>(`/suite/companies/${id}`).then(r => r.data),
  create:        (data: Record<string, unknown>)            => api.post<SaasCompany>('/suite/companies', data).then(r => r.data),
  update:        (id: number, data: Record<string, unknown>) => api.put<SaasCompany>(`/suite/companies/${id}`, data).then(r => r.data),
  suspend:       (id: number)                               => api.patch<SaasCompany>(`/suite/companies/${id}/suspend`).then(r => r.data),
  activate:      (id: number)                               => api.patch<SaasCompany>(`/suite/companies/${id}/activate`).then(r => r.data),
  remove:        (id: number)                               => api.delete(`/suite/companies/${id}`),
  users:         (id: number)                               => api.get<CompanyUser[]>(`/suite/companies/${id}/users`).then(r => r.data),
  resetPassword: (companyId: number, userId: number, password: string) =>
    api.patch(`/suite/companies/${companyId}/users/${userId}/reset-password`, { password }).then(r => r.data),
}

export const ApiKeysService = {
  list:   (companyId: number)                                          => api.get<ApiKey[]>(`/suite/companies/${companyId}/api-keys`).then(r => r.data),
  create: (companyId: number, payload: Partial<ApiKey>)                => api.post<ApiKey & { key?: string }>(`/suite/companies/${companyId}/api-keys`, payload).then(r => r.data),
  update: (companyId: number, keyId: number, payload: Partial<ApiKey>) => api.patch<ApiKey>(`/suite/companies/${companyId}/api-keys/${keyId}`, payload).then(r => r.data),
  remove: (companyId: number, keyId: number)                           => api.delete(`/suite/companies/${companyId}/api-keys/${keyId}`),
}
