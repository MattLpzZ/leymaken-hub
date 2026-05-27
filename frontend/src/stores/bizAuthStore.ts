import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios  from 'axios'
import bizApi from '@/lib/bizApi'

interface BizUser { id: number; name: string; email: string }

interface BizAuthStore {
  token:       string | null
  user:        BizUser | null
  loading:     boolean
  error:       string | null
  connect:     (email: string, password: string) => Promise<boolean>
  autoConnect: () => Promise<void>
  disconnect:  () => void
}

function applyToken(token: string) {
  localStorage.setItem('biz_token', token)
}

export const useBizAuthStore = create<BizAuthStore>()(
  persist(
    (set) => ({
      token: null, user: null, loading: false, error: null,

      connect: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { data } = await bizApi.post('/auth/login', { email, password })
          applyToken(data.token)
          set({ token: data.token, user: data.user, loading: false })
          return true
        } catch (err: any) {
          set({ error: err.response?.data?.message ?? 'Error de conexión', loading: false })
          return false
        }
      },

      autoConnect: async () => {
        set({ loading: true, error: null })
        try {
          // Use axios directly to bypass the 401-redirect interceptor on api.ts
          const token = localStorage.getItem('hub_token')
          const { data } = await axios.get('/api/biz/connect', {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          })
          applyToken(data.token)
          set({ token: data.token, user: data.user, loading: false })
        } catch {
          set({ loading: false })
        }
      },

      disconnect: () => {
        localStorage.removeItem('biz_token')
        set({ token: null, user: null, error: null })
      },
    }),
    { name: 'biz-auth', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
)
