import api from '@/lib/api'

export interface DashboardStats {
  agency_clients: number
  mrr: number
  cmm_clients: number
  pending_posts: number
  agents_active: number
  pending_queue: number
  saas_clients: number
  invoiced_month: number
}

export const DashboardService = {
  async stats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/dashboard/stats')
    return data
  },
}
