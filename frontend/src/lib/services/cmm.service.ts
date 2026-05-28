import api from '@/lib/bizApi'

export type WeekDay = 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado' | 'domingo'

export interface TimeBlockEntry {
  day: WeekDay
  hour: string
}

export interface CmmTimeBlocks {
  record: TimeBlockEntry | null
  edit: TimeBlockEntry | null
  publish: TimeBlockEntry | null
  daily_hours: number
}

export interface CmmClient {
  id: number
  name: string
  active: boolean
  is_own_brand: boolean
  folder_id: string | null
  brand_voice: string | null
  whatsapp_cta: string | null
  platforms: string[]
  fb_page_id: string | null
  fb_token: string | null
  ig_account_id: string | null
  wp_url: string | null
  wp_user: string | null
  wp_app_password: string | null
  time_blocks: CmmTimeBlocks | null
  catalog: CmmCatalogItem[]
}

export interface CmmCatalogItem {
  id: number
  cmm_client_id: number
  nombre: string
  descripcion: string | null
  precio: string | null
  whatsapp_msg: string | null
}

export type CmmPostStatus = 'borrador' | 'aprobado' | 'publicado' | 'cancelado'

export type CmmPostTipo =
  | 'educativo'
  | 'promocional'
  | 'entretenimiento'
  | 'behind_scenes'
  | 'tendencia'
  | 'anuncio'

export interface CmmPost {
  id: number
  cmm_client_id: number
  platform: string
  tipo: CmmPostTipo | null
  titulo: string | null
  contenido: string | null
  imagen_url: string | null
  fecha_programada: string | null
  hora_programada: string | null
  status: CmmPostStatus
  notas: string | null
  client?: { id: number; name: string; is_own_brand: boolean }
}

export interface CmmPostFilters {
  month?: string
  client_id?: number
  platform?: string
  status?: CmmPostStatus
  tipo?: CmmPostTipo
  ideas?: boolean
}

export const CmmService = {
  async clients(): Promise<CmmClient[]> {
    const { data } = await api.get('/cmm/clients')
    return data
  },

  async createClient(payload: Partial<CmmClient>): Promise<CmmClient> {
    const { data } = await api.post('/cmm/clients', payload)
    return data
  },

  async updateClient(id: number, payload: Partial<CmmClient>): Promise<CmmClient> {
    const { data } = await api.put(`/cmm/clients/${id}`, payload)
    return data
  },

  async deleteClient(id: number): Promise<void> {
    await api.delete(`/cmm/clients/${id}`)
  },

  async addCatalogItem(
    clientId: number,
    payload: Omit<CmmCatalogItem, 'id' | 'cmm_client_id'>,
  ): Promise<CmmCatalogItem> {
    const { data } = await api.post(`/cmm/clients/${clientId}/catalog`, payload)
    return data
  },

  async updateCatalogItem(
    clientId: number,
    itemId: number,
    payload: Partial<Omit<CmmCatalogItem, 'id' | 'cmm_client_id'>>,
  ): Promise<CmmCatalogItem> {
    const { data } = await api.put(`/cmm/clients/${clientId}/catalog/${itemId}`, payload)
    return data
  },

  async deleteCatalogItem(clientId: number, itemId: number): Promise<void> {
    await api.delete(`/cmm/clients/${clientId}/catalog/${itemId}`)
  },

  async posts(filters: CmmPostFilters = {}): Promise<CmmPost[]> {
    const { data } = await api.get('/cmm/posts', { params: filters })
    return data
  },

  async ideas(filters: Omit<CmmPostFilters, 'ideas' | 'month'> = {}): Promise<CmmPost[]> {
    const { data } = await api.get('/cmm/posts', { params: { ...filters, ideas: true } })
    return data
  },

  async createPost(
    clientId: number,
    payload: Partial<Omit<CmmPost, 'id' | 'cmm_client_id' | 'client'>>,
  ): Promise<CmmPost> {
    const { data } = await api.post(`/cmm/clients/${clientId}/posts`, payload)
    return data
  },

  async updatePost(
    postId: number,
    payload: Partial<Omit<CmmPost, 'id' | 'cmm_client_id' | 'client'>>,
  ): Promise<CmmPost> {
    const { data } = await api.put(`/cmm/posts/${postId}`, payload)
    return data
  },

  async scheduleIdea(postId: number, fecha_programada: string): Promise<CmmPost> {
    const { data } = await api.put(`/cmm/posts/${postId}`, { fecha_programada })
    return data
  },

  async updatePostStatus(postId: number, status: CmmPostStatus): Promise<CmmPost> {
    const { data } = await api.patch(`/cmm/posts/${postId}/status`, { status })
    return data
  },

  async deletePost(postId: number): Promise<void> {
    await api.delete(`/cmm/posts/${postId}`)
  },
}
