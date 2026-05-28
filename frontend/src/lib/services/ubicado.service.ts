import api from '@/lib/bizApi'

export interface ReSeller {
  id: number
  name: string
  email: string
  phone?: string
  plan: 'free' | 'basic' | 'pro'
  status: 'pending' | 'active' | 'suspended'
  listings_used: number
  created_at: string
}

export interface ReProperty {
  id: number
  title: string
  type: string
  status: string
  price: number
  currency: 'DOP' | 'USD'
  address?: string
  sector?: string
  city?: string
  province?: string
  bedrooms?: number
  bathrooms?: number
  parking?: number
  area_construida?: number
  area_terreno?: number
  features?: string[]
  photos?: string[]
  negotiable: boolean
  featured: boolean
  views: number
  seller_id?: number
  seller_name?: string
  published_at?: string
  created_at: string
}

export interface ReStats {
  total_properties: number
  by_status: Record<string, number>
  by_type: Record<string, number>
  avg_price: number
  top_viewed: { id: number; title: string; views: number }[]
  by_sector: { sector: string; count: number }[]
}

export const UbicadoService = {
  stats:          ()                                       => api.get<ReStats>('/re/stats').then(r => r.data),
  sellers:        ()                                       => api.get<ReSeller[]>('/re/sellers').then(r => r.data),
  properties:     (params?: Record<string, string>)        => api.get<ReProperty[]>('/re/properties', { params }).then(r => r.data),
  updateProperty: (id: number, data: Partial<ReProperty>)  => api.put(`/re/properties/${id}`, data).then(r => r.data),
  deleteProperty: (id: number)                             => api.delete(`/re/properties/${id}`),
}
