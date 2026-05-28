import { create } from 'zustand'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  provider?: 'gemini' | 'ollama'
}

interface AiStore {
  open: boolean
  messages: ChatMessage[]
  loading: boolean
  toggle: () => void
  close: () => void
  addMessage: (msg: ChatMessage) => void
  setLoading: (v: boolean) => void
  clear: () => void
}

export const useAiStore = create<AiStore>((set) => ({
  open: false,
  messages: [],
  loading: false,

  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setLoading: (v) => set({ loading: v }),
  clear: () => set({ messages: [] }),
}))
