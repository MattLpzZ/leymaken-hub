import api from '@/lib/api'

export interface Reminder {
  id: number
  title: string
  description?: string
  type: string
  related_to?: string
  module?: string
  due_date: string
  status: 'pendiente' | 'completado' | 'descartado'
  created_at?: string
}

export const AgendaService = {
  list:     ()                                         => api.get<Reminder[]>('/reminders').then(r => r.data),
  create:   (data: Partial<Reminder>)                  => api.post<Reminder>('/reminders', data).then(r => r.data),
  update:   (id: number, data: Partial<Reminder>)      => api.put<Reminder>(`/reminders/${id}`, data).then(r => r.data),
  complete: (id: number)                               => api.patch<Reminder>(`/reminders/${id}/complete`).then(r => r.data),
  dismiss:  (id: number)                               => api.patch<Reminder>(`/reminders/${id}/dismiss`).then(r => r.data),
  remove:   (id: number)                               => api.delete(`/reminders/${id}`),
}
