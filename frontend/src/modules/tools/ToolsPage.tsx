import { useState } from 'react'
import {
  Github, ArrowLeft, ExternalLink, Copy, Check,
  Settings, BookOpen, Play, Wrench, ChevronRight,
  Terminal, AlertCircle,
} from 'lucide-react'

type ToolStatus = 'running' | 'stopped' | 'analyzing' | 'planned'

interface EnvVar {
  key: string
  description: string
  example: string
  required: boolean
}

interface RepoTool {
  id: string
  name: string
  tagline: string
  description: string
  github: string
  tech: string[]
  status: ToolStatus
  category: string
  ports: { label: string; port: number }[]
  envVars: EnvVar[]
  dockerCompose: string
  nginxHint: string
  setupSteps: string[]
}

const TOOLS: RepoTool[] = [
  {
    id: 'mirofish',
    name: 'MiroFish',
    tagline: 'Motor de simulación multi-agente AI',
    description:
      'Crea mundos digitales poblados con miles de agentes autónomos que interactúan entre sí. Alimentas documentos o escenarios de negocio y el sistema simula cómo evolucionan para predecir resultados antes de ejecutar decisiones reales.',
    github: 'https://github.com/666ghj/MiroFish',
    tech: ['Python 3.11', 'Vue', 'Node 18', 'LLM API', 'Zep Cloud'],
    status: 'planned',
    category: 'AI / Agents',
    ports: [
      { label: 'Frontend', port: 3000 },
      { label: 'Backend API', port: 5001 },
    ],
    envVars: [
      {
        key: 'LLM_API_KEY',
        description: 'API key de Groq (groq.com — free tier generoso, sin tarjeta)',
        example: 'gsk_xxxxxxxx',
        required: true,
      },
      {
        key: 'LLM_BASE_URL',
        description: 'Endpoint Groq (compatible con OpenAI SDK, no requiere cambiar código)',
        example: 'https://api.groq.com/openai/v1',
        required: true,
      },
      {
        key: 'LLM_MODEL_NAME',
        description: 'Modelo Groq recomendado para simulación',
        example: 'llama-3.3-70b-versatile',
        required: true,
      },
      {
        key: 'ZEP_API_KEY',
        description: 'Zep Cloud memoria de agentes — free tier en getzep.com (sin alternativa sin modificar código)',
        example: 'z_xxxxxxxx',
        required: true,
      },
    ],
    dockerCompose: `services:
  mirofish:
    image: ghcr.io/666ghj/mirofish:latest
    container_name: mirofish
    env_file:
      - .env
    ports:
      - "3000:3000"
      - "5001:5001"
    restart: unless-stopped
    volumes:
      - ./backend/uploads:/app/backend/uploads`,
    nginxHint: `# Agrega esto en el nginx del VPS para poder iframearlo desde el OS:
location /tools/mirofish/ {
    proxy_pass http://localhost:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    add_header X-Frame-Options "ALLOWALL";
}`,
    setupSteps: [
      'Crea cuenta gratis en groq.com → API Keys → copia tu LLM_API_KEY (sin tarjeta de crédito)',
      'Crea cuenta gratis en getzep.com → copia tu ZEP_API_KEY (free tier suficiente para uso básico)',
      'SSH al VPS: mkdir -p /var/www/leymaken/services/mirofish && cd /var/www/leymaken/services/mirofish',
      'Crea el archivo .env con las variables de entorno (ver sección abajo)',
      'Crea docker-compose.yml con el contenido de abajo',
      'Levanta el servicio: docker compose up -d',
      'Verifica que corre: curl http://localhost:3000',
      'Agrega el bloque nginx para permitir iframe (ver sección Nginx)',
      'Reload nginx: nginx -s reload',
      'Ingresa la URL del servicio en la pestaña Configurar de este módulo',
    ],
  },
]

const STATUS_META: Record<ToolStatus, { label: string; dot: string; text: string }> = {
  running:   { label: 'Corriendo',  dot: 'bg-emerald-400', text: 'text-emerald-400' },
  stopped:   { label: 'Detenido',   dot: 'bg-red-400',     text: 'text-red-400'    },
  analyzing: { label: 'Analizando', dot: 'bg-amber-400',   text: 'text-amber-400'  },
  planned:   { label: 'Planeado',   dot: 'bg-blue-400',    text: 'text-blue-400'   },
}

function useToolUrl(toolId: string) {
  const key = `tool-url-${toolId}`
  const [url, setUrl] = useState(() => localStorage.getItem(key) ?? '')
  const save = (v: string) => { localStorage.setItem(key, v); setUrl(v) }
  const clear = () => { localStorage.removeItem(key); setUrl('') }
  return { url, save, clear }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="p-1 text-gray-600 hover:text-gray-300 transition-colors">
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  )
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.07] overflow-hidden">
      {label && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-white/[0.07]">
          <span className="text-[10px] font-mono text-gray-600">{label}</span>
          <CopyButton text={code} />
        </div>
      )}
      <pre className="text-xs font-mono text-gray-400 p-3 overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  )
}

function ToolCard({ tool, onOpen }: { tool: RepoTool; onOpen: () => void }) {
  const { url } = useToolUrl(tool.id)
  const status = STATUS_META[tool.status]

  return (
    <button
      onClick={onOpen}
      className="card border border-white/[0.06] rounded-xl p-5 flex flex-col gap-3 text-left hover:border-white/[0.14] transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600/20 transition-colors">
          <Wrench size={16} className="text-gray-400 group-hover:text-emerald-400 transition-colors" />
        </div>
        <ChevronRight size={14} className="text-gray-700 group-hover:text-gray-400 transition-colors mt-0.5" />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-semibold text-white">{tool.name}</h3>
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            <span className={`text-[10px] ${status.text}`}>{status.label}</span>
          </span>
        </div>
        <p className="text-xs text-gray-500">{tool.tagline}</p>
      </div>

      <div className="flex flex-wrap gap-1">
        {tool.tech.slice(0, 3).map(t => (
          <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-600 border border-white/[0.05]">
            {t}
          </span>
        ))}
        {tool.tech.length > 3 && (
          <span className="text-[10px] text-gray-600">+{tool.tech.length - 3}</span>
        )}
      </div>

      <div className={`text-[10px] font-medium flex items-center gap-1 ${url ? 'text-emerald-400' : 'text-gray-600'}`}>
        {url ? '● URL configurada' : '○ Sin configurar'}
      </div>
    </button>
  )
}

type DetailTab = 'overview' | 'install' | 'config'

function ToolDetail({
  tool,
  onBack,
  onOpenIframe,
}: {
  tool: RepoTool
  onBack: () => void
  onOpenIframe: (url: string) => void
}) {
  const [tab, setTab] = useState<DetailTab>('overview')
  const { url, save, clear } = useToolUrl(tool.id)
  const [urlInput, setUrlInput] = useState(url)
  const status = STATUS_META[tool.status]

  const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview',    icon: BookOpen  },
    { id: 'install',  label: 'Instalación', icon: Terminal  },
    { id: 'config',   label: 'Configurar',  icon: Settings  },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-200 transition-colors">
          <ArrowLeft size={14} /> Tools
        </button>
        <span className="text-gray-700">/</span>
        <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{tool.name}</span>
        <a href={tool.github} target="_blank" rel="noopener noreferrer" className="ml-auto text-gray-600 hover:text-gray-300 transition-colors">
          <Github size={15} />
        </a>
      </div>

      <div className="card border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
            <Wrench size={20} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white">{tool.name}</h2>
              <span className={`text-xs flex items-center gap-1.5 ${status.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-gray-500 border border-white/[0.06]">
                {tool.category}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{tool.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tool.tech.map(t => (
                <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-gray-500 border border-white/[0.06]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {url && (
          <button
            onClick={() => onOpenIframe(url)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            <Play size={14} /> Abrir herramienta
          </button>
        )}
        {!url && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-amber-400/5 border border-amber-400/20">
            <AlertCircle size={13} className="text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-400/80">Instala el servicio y configura la URL para poder abrirlo aquí.</p>
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-white/[0.06]">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-600 hover:text-gray-300'
              }`}
            >
              <Icon size={12} /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {tool.ports.map(p => (
              <div key={p.port} className="card border border-white/[0.06] rounded-lg p-3">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">{p.label}</p>
                <p className="text-sm font-mono text-white mt-0.5">:{p.port}</p>
              </div>
            ))}
          </div>
          <div className="card border border-white/[0.06] rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Variables de entorno</p>
            {tool.envVars.map(v => (
              <div key={v.key} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-400">{v.key}</span>
                  {v.required && <span className="text-[9px] text-red-400">requerida</span>}
                </div>
                <p className="text-[11px] text-gray-500">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'install' && (
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 mb-3">Pasos de instalación</p>
            {tool.setupSteps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-gray-600">
                  {i + 1}
                </span>
                <p className="text-xs text-gray-400 leading-relaxed pt-0.5">{step}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400">.env</p>
            <CodeBlock
              label=".env"
              code={tool.envVars.map(v => `${v.key}=${v.example}`).join('\n')}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400">docker-compose.yml</p>
            <CodeBlock label="docker-compose.yml" code={tool.dockerCompose} />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400">Nginx — permitir iframe desde el OS</p>
            <CodeBlock label="nginx.conf (fragmento)" code={tool.nginxHint} />
          </div>

          <CodeBlock
            label="Comandos VPS"
            code={`cd /var/www/leymaken/services/mirofish
docker compose up -d
# verificar
docker compose ps
curl http://localhost:3000`}
          />
        </div>
      )}

      {tab === 'config' && (
        <div className="space-y-4 max-w-md">
          <p className="text-xs text-gray-500">
            Ingresa la URL donde está corriendo el servicio (ej: <span className="font-mono text-gray-400">https://leymaken.com/tools/mirofish</span> o <span className="font-mono text-gray-400">http://localhost:3000</span>).
          </p>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">URL del servicio</label>
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://leymaken.com/tools/mirofish"
              className="input w-full text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => save(urlInput.trim())}
              disabled={!urlInput.trim()}
              className="btn-primary text-sm px-4 py-2 disabled:opacity-40"
            >
              Guardar
            </button>
            {url && (
              <button onClick={() => { clear(); setUrlInput('') }} className="btn-secondary text-sm px-4 py-2">
                Limpiar
              </button>
            )}
          </div>
          {url && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <Check size={12} /> URL guardada — puedes abrir la herramienta desde la pestaña Overview
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function IframeView({ tool, url, onBack }: { tool: RepoTool; url: string; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full -m-4 lg:-m-6">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-gray-950 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-200 transition-colors">
          <ArrowLeft size={14} /> Volver
        </button>
        <span className="text-gray-700">|</span>
        <Wrench size={12} className="text-gray-600" />
        <span className="text-sm font-medium text-gray-300">{tool.name}</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto text-gray-600 hover:text-gray-300 transition-colors" title="Abrir en nueva pestaña">
          <ExternalLink size={13} />
        </a>
      </div>
      <iframe
        src={url}
        className="flex-1 w-full border-0"
        title={tool.name}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}

type View = { type: 'grid' } | { type: 'detail'; tool: RepoTool } | { type: 'iframe'; tool: RepoTool; url: string }

export default function ToolsPage() {
  const [view, setView] = useState<View>({ type: 'grid' })

  if (view.type === 'iframe') {
    return (
      <IframeView
        tool={view.tool}
        url={view.url}
        onBack={() => setView({ type: 'detail', tool: view.tool })}
      />
    )
  }

  if (view.type === 'detail') {
    return (
      <ToolDetail
        tool={view.tool}
        onBack={() => setView({ type: 'grid' })}
        onOpenIframe={(url) => setView({ type: 'iframe', tool: view.tool, url })}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>Tools</h1>
        <p className="text-sm text-gray-500 mt-0.5">Herramientas instaladas o en análisis para el stack</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {TOOLS.map(tool => (
          <ToolCard
            key={tool.id}
            tool={tool}
            onOpen={() => setView({ type: 'detail', tool })}
          />
        ))}
      </div>
    </div>
  )
}
