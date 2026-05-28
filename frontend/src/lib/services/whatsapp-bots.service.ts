import api from '@/lib/bizApi'

export interface BotConfig {
  id: number
  name: string
  empresa: string
  empresa_telefono: string | null
  moneda: string
  status: 'active' | 'inactive'
  provider: 'evolution' | 'meta' | 'wwebjs'
  evolution_host: string | null
  evolution_instance: string | null
  evolution_apikey: string | null
  meta_phone_id: string | null
  meta_token: string | null
  webhook_path: string
  db_host: string | null
  db_port: number
  db_name: string | null
  db_user: string | null
  db_password: string | null
  db_table: string | null
  db_field_phone: string | null
  db_field_cedula: string | null
  db_field_name: string | null
  session_timeout_minutes: number
  ai_model: string | null
  ai_system_prompt: string | null
  data_source_type: 'none' | 'api' | 'json'
  data_source_url: string | null
  data_source_method: 'GET' | 'POST'
  data_source_headers: string | null
  data_source_config: string | null
  menu_items?: BotMenuItem[]
  menu_items_count?: number
  created_at: string
}

export interface BotMenuItem {
  id: number
  bot_config_id: number
  numero: number
  label: string
  requires_verification: boolean
  response_type: 'db_field' | 'static' | 'template'
  response_field: string | null
  response_template: string | null
  active: boolean
  sort_order: number
}

export interface WebjsStatus {
  status: 'not_initialized' | 'initializing' | 'qr_needed' | 'connected' | 'disconnected' | 'auth_failed' | 'error'
  hasQr: boolean
}

export const WhatsAppBotsService = {
  list: (): Promise<{ data: BotConfig[] }> =>
    api.get('/bot-configs').then(r => r.data),

  get: (id: number): Promise<{ data: BotConfig }> =>
    api.get(`/bot-configs/${id}`).then(r => r.data),

  create: (data: Partial<BotConfig>): Promise<{ data: BotConfig }> =>
    api.post('/bot-configs', data).then(r => r.data),

  update: (id: number, data: Partial<BotConfig>): Promise<{ data: BotConfig }> =>
    api.put(`/bot-configs/${id}`, data).then(r => r.data),

  remove: (id: number): Promise<void> =>
    api.delete(`/bot-configs/${id}`).then(() => undefined),

  addMenuItem: (botId: number, data: Partial<BotMenuItem>): Promise<{ data: BotMenuItem }> =>
    api.post(`/bot-configs/${botId}/menu-items`, data).then(r => r.data),

  updateMenuItem: (botId: number, itemId: number, data: Partial<BotMenuItem>): Promise<{ data: BotMenuItem }> =>
    api.put(`/bot-configs/${botId}/menu-items/${itemId}`, data).then(r => r.data),

  removeMenuItem: (botId: number, itemId: number): Promise<void> =>
    api.delete(`/bot-configs/${botId}/menu-items/${itemId}`).then(() => undefined),

  testConnection: (id: number): Promise<{ ok: boolean; message: string; sample_columns?: string[] }> =>
    api.post(`/bot-configs/${id}/test-connection`).then(r => r.data),

  webjsInit: (id: number): Promise<{ status: string; qr: string | null }> =>
    api.post(`/bot-configs/${id}/wwebjs/init`).then(r => r.data),

  webjsStatus: (id: number): Promise<WebjsStatus> =>
    api.get(`/bot-configs/${id}/wwebjs/status`).then(r => r.data),

  webjsQr: (id: number): Promise<{ qr: string }> =>
    api.get(`/bot-configs/${id}/wwebjs/qr`).then(r => r.data),

  webjsDisconnect: (id: number): Promise<{ success: boolean }> =>
    api.delete(`/bot-configs/${id}/wwebjs/session`).then(r => r.data),

  evolutionStatus: (id: number): Promise<{ state: string }> =>
    api.get(`/bot-configs/${id}/evolution/status`).then(r => r.data),

  evolutionSync: (id: number): Promise<{ state: string; webhook: string }> =>
    api.post(`/bot-configs/${id}/evolution/sync`).then(r => r.data),

  evolutionConnect: (id: number): Promise<{ base64?: string; code?: string; error?: string }> =>
    api.get(`/bot-configs/${id}/evolution/connect`).then(r => r.data),

  evolutionDisconnect: (id: number): Promise<{ state: string; webhook: string }> =>
    api.post(`/bot-configs/${id}/evolution/disconnect`).then(r => r.data),
}
