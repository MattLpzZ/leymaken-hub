import { create } from 'zustand'
import api from '@/lib/api'

interface Container { id: string; name: string; state: string; status: string }
interface Repo      { name: string; full_name: string; default_branch: string; updated_at: string; html_url: string; latest_commit?: { sha: string; message: string; author: string; date: string } }
interface Zone      { id: string; name: string; status: string; analytics?: { requests: number; bandwidth: number; threats: number } }
interface Worker    { id: string; modified_on: string }

interface InfraStore {
  containers: Container[]
  repos:      Repo[]
  zones:      Zone[]
  workers:    Worker[]
  loading:    { docker: boolean; github: boolean; cloudflare: boolean }
  fetchDocker:     () => Promise<void>
  fetchGithub:     () => Promise<void>
  fetchCloudflare: () => Promise<void>
  restartContainer: (name: string) => Promise<boolean>
}

export const useInfraStore = create<InfraStore>((set) => ({
  containers: [], repos: [], zones: [], workers: [],
  loading: { docker: false, github: false, cloudflare: false },

  fetchDocker: async () => {
    set(s => ({ loading: { ...s.loading, docker: true } }))
    try {
      const { data } = await api.get('/infra/docker')
      set({ containers: data.containers })
    } finally {
      set(s => ({ loading: { ...s.loading, docker: false } }))
    }
  },

  fetchGithub: async () => {
    set(s => ({ loading: { ...s.loading, github: true } }))
    try {
      const { data } = await api.get('/infra/github')
      set({ repos: data.repos })
    } finally {
      set(s => ({ loading: { ...s.loading, github: false } }))
    }
  },

  fetchCloudflare: async () => {
    set(s => ({ loading: { ...s.loading, cloudflare: true } }))
    try {
      const { data } = await api.get('/infra/cloudflare')
      set({ zones: data.zones, workers: data.workers })
    } finally {
      set(s => ({ loading: { ...s.loading, cloudflare: false } }))
    }
  },

  restartContainer: async (name) => {
    try {
      await api.post(`/infra/docker/${name}/restart`)
      return true
    } catch {
      return false
    }
  },
}))
