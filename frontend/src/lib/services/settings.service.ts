import api from '@/lib/api'

export interface HubSettings {
  // Empresa
  company_name?: string
  company_slogan?: string
  company_legal_name?: string
  company_rnc?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  company_website?: string
  company_logo_url?: string
  // Sistema
  system_n8n_url?: string
  system_currency?: string
  system_timezone?: string
  n8n_api_key?: string
  n8n_webhook_invoice_paid?: string
  n8n_webhook_new_lead?: string
  n8n_webhook_low_stock?: string
  // Apariencia
  appearance_theme?: string
  appearance_color?: string
  // Telegram
  telegram_bot_token?: string
  telegram_chat_id?: string
  telegram_enabled?: boolean
  telegram_severity?: string
  // Email
  mail_host?: string
  mail_port?: string
  mail_username?: string
  mail_password?: string
  mail_from_address?: string
  mail_from_name?: string
  mail_encryption?: string
  mail_enabled?: boolean
  // Impresión
  print_paper_size?: string
  print_orientation?: string
  print_show_logo?: boolean
  print_show_footer?: boolean
  print_footer_text?: string
  print_primary_color?: string
  // Alertas
  notif_container_caido?: boolean
  notif_n8n_error?: boolean
  notif_nuevo_lead?: boolean
  notif_factura_vencida?: boolean
  notif_nuevo_ticket?: boolean
  notif_pago_recibido?: boolean
}

export interface HubUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  active: boolean
  created_at: string
}

export const SettingsService = {
  async get(): Promise<HubSettings> {
    const { data } = await api.get('/settings')
    return data
  },
  async update(payload: Partial<HubSettings>): Promise<void> {
    await api.patch('/settings', payload)
  },
  async testEmail(to: string): Promise<{ ok: boolean; error?: string }> {
    const { data } = await api.post('/settings/test-email', { to })
    return data
  },
}

export const UsersService = {
  async list(): Promise<HubUser[]> {
    const { data } = await api.get('/users')
    return data
  },
  async create(payload: { name: string; email: string; password: string; role: string }): Promise<HubUser> {
    const { data } = await api.post('/users', payload)
    return data
  },
  async update(id: number, payload: Partial<HubUser & { password?: string }>): Promise<HubUser> {
    const { data } = await api.patch(`/users/${id}`, payload)
    return data
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/users/${id}`)
  },
}
