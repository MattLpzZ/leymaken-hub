import { create } from 'zustand'
import api from '@/lib/api'

interface User { id: number; name: string; email: string }

interface AuthStore {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  init: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('hub_token'),
  loading: true,

  init: async () => {
    const token = localStorage.getItem('hub_token')
    if (!token) { set({ loading: false }); return }
    try {
      const { data } = await api.get('/user')
      set({ user: data, loading: false })
    } catch {
      localStorage.removeItem('hub_token')
      set({ user: null, token: null, loading: false })
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/login', { email, password })
    localStorage.setItem('hub_token', data.token)
    set({ user: data.user, token: data.token })
  },

  logout: async () => {
    await api.post('/logout').catch(() => {})
    localStorage.removeItem('hub_token')
    set({ user: null, token: null })
  },
}))
