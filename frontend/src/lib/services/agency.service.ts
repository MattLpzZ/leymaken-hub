import api from '@/lib/bizApi'
import type { CmmTimeBlocks } from './cmm.service'

export type AgencyService = 'cmm' | 'desarrollo' | 'automatizaciones'

export interface AgencyClient {
  id: number
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  plan_mensual: string | null
  servicios: AgencyService[]
  cmm_client_id: number | null
  time_blocks: CmmTimeBlocks | null
  fecha_inicio: string | null
  active: boolean
  notas: string | null
  created_at: string
}

export const AgencyService_ = {
  list():                                            Promise<AgencyClient[]> {
    return api.get('/agency-clients').then(r => r.data)
  },
  create(data: Partial<AgencyClient>):               Promise<AgencyClient> {
    return api.post('/agency-clients', data).then(r => r.data)
  },
  update(id: number, data: Partial<AgencyClient>):   Promise<AgencyClient> {
    return api.put(`/agency-clients/${id}`, data).then(r => r.data)
  },
  remove(id: number):                                Promise<void> {
    return api.delete(`/agency-clients/${id}`)
  },
}
