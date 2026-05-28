import api from '@/lib/bizApi'

export interface Ticket {
  id: number
  company_id: number | null
  subject: string
  description: string | null
  status: 'open' | 'in_progress' | 'waiting' | 'closed'
  priority: 'low' | 'medium' | 'high'
  source: 'whatsapp' | 'instagram' | 'manual' | 'email'
  contact_name: string | null
  contact_info: string | null
  assigned_to: number | null
  resolution: string | null
  closed_at: string | null
  created_at: string
  company?: { id: number; name: string }
}

export interface TicketSummary {
  open: number
  in_progress: number
  waiting: number
  closed: number
  closed_today: number
  total: number
}

export interface TicketFilters {
  status?: string
  priority?: string
  search?: string
}

export const TicketsService = {
  async list(filters: TicketFilters = {}) {
    const { data } = await api.get('/tickets', { params: filters })
    return data
  },

  async summary(): Promise<TicketSummary> {
    const { data } = await api.get('/tickets-summary')
    return data
  },

  async create(payload: Partial<Ticket>) {
    const { data } = await api.post('/tickets', payload)
    return data as Ticket
  },

  async update(id: number, payload: Partial<Ticket>) {
    const { data } = await api.put(`/tickets/${id}`, payload)
    return data as Ticket
  },

  async destroy(id: number) {
    await api.delete(`/tickets/${id}`)
  },
}
