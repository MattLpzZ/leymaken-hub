# LEYMAKEN HUB — Design Spec
**Date:** 2026-05-26
**Repo:** `leymaken-hub`
**URL:** `hub.leymaken.com`
**Stack:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui · Laravel 12 + Sanctum · MySQL

---

## 1. Visión

LEYMAKEN HUB es el sucesor de soymatt-platform. Una plataforma de desarrollo self-hosted que unifica:

- **Mission Control** — visibilidad total de infra en una pantalla (VPS, GitHub, Cloudflare)
- **Negocio** — CRM, CMM, Finance, Facturación, SaaS (migrado de soymatt-platform)
- **AI Agent** — agente Claude-powered con contexto del Hub y tool use sobre la infra
- **Platform Layer** — workers, bots WhatsApp/Telegram, resources linkados a proyectos

El objetivo central: Matt gestiona toda su infraestructura, proyectos y clientes desde un solo lugar, asistido por un agente AI que aprende sus procesos y puede actuar sobre el sistema.

---

## 2. Arquitectura

### Estructura del repo

```
leymaken-hub/
├── frontend/                    # React 18 + Vite + TypeScript
│   └── src/
│       ├── modules/
│       │   ├── mission-control/ # Dashboard infra
│       │   ├── agent/           # Chat + Research + Vault
│       │   ├── crm/             # Clientes, pipeline, contactos
│       │   ├── cmm/             # Calendario, publicaciones, ideas
│       │   ├── finance/         # Ingresos, gastos, quincenas
│       │   ├── billing/         # Facturas, caja
│       │   ├── saas/            # Tenants, licencias
│       │   ├── platform/        # Workers, bots, resources
│       │   └── settings/        # Config global
│       ├── stores/              # authStore, infraStore, agentStore
│       ├── components/          # Shell: Sidebar + Header + Layout
│       └── lib/                 # API client (axios + interceptors)
├── backend/                     # Laravel 12
│   └── app/
│       ├── Http/Controllers/
│       │   ├── InfraController.php
│       │   ├── AgentController.php
│       │   └── PlatformController.php
│       ├── Services/
│       │   ├── DockerService.php      # SSH al VPS → containers
│       │   ├── GitHubService.php      # GitHub REST API v3
│       │   ├── CloudflareService.php  # Cloudflare API v4
│       │   └── AgentService.php       # Claude API (stub → real)
│       └── Jobs/
│           └── PollInfraJob.php       # Polling cada 60s, cachea en Redis/DB
├── docker/
│   ├── docker-compose.yml
│   └── nginx.conf
└── docs/
    └── superpowers/specs/
```

### Base de datos

Nueva BD: `leymaken_hub` en el container `leymaken_mysql` existente.
Las tablas de negocio (CRM, CMM, Finance) se migran desde `leymaken_os`.

### Deploy

- Container: `leymaken_hub` (PHP-FPM + nginx)
- Proxy: HestiaCP apunta `hub.leymaken.com` → container
- Comparte `leymaken_mysql` y `leymaken_redis` con los containers existentes
- Build pattern: igual a soymatt-platform (`docker compose build` + `docker cp` para hot-deploy)

---

## 3. Design System

Mismo sistema visual de soymatt-platform, portado limpio:

```css
/* Variables core */
--app-bg:    #030712   /* gray-950 */
--surface:   #111827   /* gray-900 */
--surface-2: #1f2937   /* gray-800 */
--border:    #374151   /* gray-700 */
--text-1:    #f9fafb
--text-2:    #9ca3af
--text-3:    #6b7280
--accent:    #10b981   /* emerald-500 — marca personal Matt */
```

Shell: sidebar colapsable (240px / 64px) + header fijo (h-16) + main scrollable.
Clases globales: `.card`, `.btn-primary`, `.btn-secondary`, `.input`, `.badge`, `.badge-*`

---

## 4. Módulos

### 4.1 Mission Control (MVP — Fase 1)

Dashboard principal con 4 secciones:

**Infra Overview**
- Lista de containers Docker del VPS: nombre, status (running/stopped/error), CPU %, RAM %
- Botones: reiniciar, ver logs (últimas 100 líneas)
- Actualización: polling cada 60s vía `PollInfraJob`, resultado cacheado en DB
- Conexión: `DockerService` via SSH (creds en `.env`) — no se expone Docker TCP socket

**GitHub Feed**
- Repos del usuario: nombre, branch activo, último commit (autor, mensaje, tiempo relativo)
- Status: si tiene CI, muestra último run (pass/fail)
- Conexión: `GitHubService` con Personal Access Token en `.env`

**Cloudflare Panel**
- Dominios (zones): nombre, status, tráfico last 24h
- Workers & Pages: nombre, último deploy, requests last 1h
- Conexión: `CloudflareService` con API Token (permisos: Zone:Read, Analytics:Read, Workers:Read)

**Live Feed**
- Stream cronológico de eventos cruzados: deploy, commit, restart de container, spike de tráfico
- Máximo 50 eventos, más reciente primero

### 4.2 AI Agent (Fase 2)

**Chat**
- Streaming SSE (igual a `mi-ia-privada`)
- Historial persistido en `agent_chats` + `agent_messages`
- Contexto inyectado automáticamente: infra status, MRR, repos activos
- Cuando Claude API key no está configurada: muestra banner "Configura tu API key en Settings"

**Tool Use (acciones que el agente puede ejecutar)**
```
restart_container(name)         → DockerService::restart()
get_container_logs(name, lines) → DockerService::logs()
get_repo_status(repo)           → GitHubService::repoStatus()
search_vault(query)             → búsqueda full-text en vault_notes
get_crm_snapshot()              → resumen clientes + MRR
```

**Research**
- El agente puede investigar en internet (DuckDuckGo) y sintetizar con Claude
- Resultados guardados como notas en Vault

**Vault**
- Notas en Markdown, organizadas por carpetas
- Búsqueda full-text MySQL (sin ChromaDB — sin dependencias extra)
- Sync opcional con Obsidian via script CLI

**AgentService — diseño del stub**
```php
// Cuando API key no está: retorna respuesta mock
// Cuando API key está: llama Claude claude-haiku-4-5-20251001
class AgentService {
    public function chat(string $message, array $context, array $history): Generator
    public function callTool(string $tool, array $params): mixed
}
```

### 4.3 Negocio (Fase 3 — migración)

Migración 1:1 de los módulos de soymatt-platform:
- **CRM**: clientes activos, pipeline (deals), contactos (leads)
- **CMM**: calendario de contenido, publicaciones, ideas bank
- **Finance**: transacciones, gastos fijos, quincenas
- **Facturación**: facturas, caja
- **SaaS**: tenants, onboarding, licencias

Las tablas de `leymaken_os` se migran a `leymaken_hub` con scripts de migración de datos.

### 4.4 Platform Layer (Fase 4)

**Workers & Bots**
- Registro de workers (nombre, tipo: telegram/whatsapp/script, status)
- Cada worker corre como proceso supervisado en el VPS (PM2 para Node.js, supervisord para Python)
- Desde el Hub: ver logs, reiniciar, configurar variables de entorno

**WhatsApp Agents (OpenWA)**
- Instancias de agentes WhatsApp por cliente usando OpenWA
- Cada instancia tiene: número, prompt del agente, modelo Claude, webhook
- Producto vendible: un cliente paga por tener su agente WhatsApp

**Resources**
- DB instances: crear/listar bases MySQL linkadas a proyectos
- Storage: carpetas/volumes Docker disponibles para workers
- Cada proyecto puede tener: `workers[]`, `resources[]`, `domain`, `repo`

---

## 5. Integraciones externas

| Servicio | Credencial | Permisos necesarios |
|---|---|---|
| Docker VPS | SSH key o TCP socket | Exec containers |
| GitHub | Personal Access Token | repo, read:user |
| Cloudflare | API Token | Zone:Read, Analytics:Read, Workers:Read |
| Claude API | API Key (ANTHROPIC_API_KEY) | Haiku model access |
| OpenWA | Auto-generado por instancia | — |

Todas las credenciales viven en `.env` del backend, configurables desde Settings > Integraciones.

---

## 6. Roadmap por fases

| Fase | Contenido | Objetivo |
|------|-----------|----------|
| **Fase 1 — MVP** | Repo scaffold + auth + Mission Control (Docker + GitHub + Cloudflare) | Ver toda la infra en una pantalla |
| **Fase 2 — Agent** | AgentService stub + Chat UI + Vault + Tool Use | Agente listo, conectar API key cuando Matt esté listo |
| **Fase 3 — Negocio** | Migración CRM + CMM + Finance + Billing + SaaS | Reemplaza soymatt-platform por completo |
| **Fase 4 — Platform** | Workers manager + WhatsApp agents (OpenWA) + Resources | Producto vendible de agentes |

**MVP target:** 2 semanas para tener Mission Control funcional en `hub.leymaken.com`.

---

## 7. Decisiones clave

- **Claude Haiku en vez de Ollama**: calidad superior, ~$1-3/mes, sin requerir GPU. API key se configura cuando el sistema esté listo.
- **MySQL full-text en vez de ChromaDB**: elimina dependencia Python para el vault. Suficiente para búsqueda semántica básica.
- **Repo nuevo limpio**: sin herencia de soymatt-platform — arquitectura diseñada desde el inicio para este propósito.
- **Mismo design system**: mismas CSS variables y shell que soymatt-platform — familiaridad visual inmediata.
- **soymatt-platform sigue en producción** hasta que Fase 3 esté completa y validada.
