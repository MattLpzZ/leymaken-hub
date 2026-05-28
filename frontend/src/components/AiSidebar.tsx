import { useEffect, useRef, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useAiStore } from '@/stores/aiStore'
import type { ChatMessage } from '@/stores/aiStore'
import api from '@/lib/api'

interface ProviderStatus {
  gemini: boolean | null
  ollama: boolean | null
}

const SUGGESTIONS = [
  'Resumen del negocio',
  '¿Qué facturas están vencidas?',
  'Dame ideas para conseguir clientes',
]

function ProviderDot({ available }: { available: boolean | null }) {
  const color =
    available === true ? '#10b981' : available === false ? '#ef4444' : '#6b7280'
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
      }}
    />
  )
}

function LoadingDots() {
  return (
    <div
      className="rounded-2xl rounded-tl-sm px-4 py-2 text-sm max-w-[85%]"
      style={{ background: 'var(--surface-2)', color: 'var(--text-1)' }}
    >
      <span className="inline-flex gap-1 items-center">
        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
      </span>
    </div>
  )
}

export function AiSidebar() {
  const { open, messages, loading, close, addMessage, setLoading } = useAiStore()
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<ProviderStatus>({ gemini: null, ollama: null })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    api.get('/ai/status')
      .then(({ data }) => {
        setStatus({
          gemini: data.gemini ?? null,
          ollama: data.ollama ?? null,
        })
      })
      .catch(() => {
        setStatus({ gemini: null, ollama: null })
      })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    addMessage(userMsg)
    setInput('')
    setLoading(true)

    try {
      const { data } = await api.post('/ai/chat', {
        messages: [...messages, userMsg],
      })
      addMessage({
        role: 'assistant',
        content: data.content ?? data.message ?? '',
        provider: data.provider,
      })
    } catch {
      addMessage({
        role: 'assistant',
        content: 'Error al conectar con el asistente',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  function handleSuggestion(s: string) {
    send(s)
  }

  const hasMessages = messages.length > 0

  return (
    <div
      className="fixed right-0 top-0 h-screen z-40 flex flex-col transition-transform duration-300"
      style={{
        width: 320,
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
      }}
    >
      {/* Header */}
      <div
        className="h-16 flex items-center justify-between px-4 flex-shrink-0 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} color="#10b981" />
          <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
            Asistente IA
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" title="Gemini">
            <ProviderDot available={status.gemini} />
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>G</span>
          </div>
          <div className="flex items-center gap-1" title="Ollama">
            <ProviderDot available={status.ollama} />
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>O</span>
          </div>
          <button
            className="ml-1 p-1 rounded hover:bg-gray-800"
            onClick={close}
          >
            <X size={16} style={{ color: 'var(--text-2)' }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-sm text-center" style={{ color: 'var(--text-2)' }}>
              ¿En qué te puedo ayudar hoy?
            </p>
            <div className="flex flex-col gap-2 w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="text-xs px-3 py-2 rounded-lg text-left transition-colors hover:bg-gray-800"
                  style={{
                    background: 'var(--surface-2)',
                    color: 'var(--text-2)',
                    border: '1px solid var(--border)',
                  }}
                  onClick={() => handleSuggestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`px-4 py-2 text-sm max-w-[85%] ${
                    msg.role === 'user'
                      ? 'rounded-2xl rounded-tr-sm'
                      : 'rounded-2xl rounded-tl-sm'
                  }`}
                  style={
                    msg.role === 'user'
                      ? {
                          background: 'rgba(16,185,129,0.2)',
                          color: '#6ee7b7',
                        }
                      : {
                          background: 'var(--surface-2)',
                          color: 'var(--text-1)',
                        }
                  }
                >
                  {msg.content}
                </div>
                {msg.role === 'assistant' && msg.provider && (
                  <span
                    className="text-xs mt-1 px-2 py-0.5 rounded-full"
                    style={{
                      background: 'var(--surface-2)',
                      color: 'var(--text-3)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {msg.provider === 'gemini' ? 'Gemini' : 'Ollama'}
                  </span>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start">
                <LoadingDots />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 p-3 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={2}
            className="input flex-1 text-sm resize-none"
            placeholder="Escribe un mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            style={{ minHeight: 0 }}
          />
          <button
            className="btn-primary text-xs px-3 py-2 flex-shrink-0"
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
