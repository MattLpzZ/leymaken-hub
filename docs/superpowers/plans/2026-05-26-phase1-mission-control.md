# LEYMAKEN HUB — Phase 1: Mission Control MVP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold el repo `leymaken-hub` y construir el Mission Control dashboard mostrando containers Docker (VPS), repos GitHub y zonas/workers Cloudflare en tiempo real desde `hub.leymaken.com`.

**Architecture:** Frontend React 18 + Vite servido por nginx, API Laravel 12 en backend. Ambos corren como containers Docker en VPS Contabo, compartiendo el container `leymaken_mysql` existente. El backend conecta a Docker via Unix socket, GitHub API y Cloudflare API v4, cachea resultados en MySQL cada 60s y los expone como JSON.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Zustand | Laravel 12, Sanctum, Guzzle, MySQL, Laravel Queue (database driver)

---

## File Map

```
leymaken-hub/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css                          # CSS variables + base
│       ├── lib/
│       │   └── api.ts                         # Axios instance
│       ├── stores/
│       │   ├── authStore.ts
│       │   └── infraStore.ts
│       ├── components/
│       │   ├── Layout.tsx                     # Shell: sidebar + header + main
│       │   ├── Sidebar.tsx
│       │   └── Header.tsx
│       └── modules/
│           ├── auth/
│           │   └── LoginPage.tsx
│           └── mission-control/
│               ├── MissionControlPage.tsx     # Ensambla los 4 paneles
│               ├── InfraOverview.tsx          # Docker containers
│               ├── GitHubFeed.tsx             # Repos + commits
│               ├── CloudflarePanel.tsx        # Zones + workers
│               └── LiveFeed.tsx               # Stream de eventos cruzados
├── backend/
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/
│   │   │       ├── AuthController.php
│   │   │       └── InfraController.php
│   │   ├── Services/
│   │   │   ├── DockerService.php
│   │   │   ├── GitHubService.php
│   │   │   └── CloudflareService.php
│   │   └── Jobs/
│   │       └── PollInfraJob.php
│   ├── database/
│   │   └── migrations/
│   │       └── 2026_05_26_000001_create_infra_snapshots_table.php
│   ├── routes/
│   │   └── api.php
│   └── tests/
│       ├── Feature/
│       │   └── InfraControllerTest.php
│       └── Unit/
│           ├── DockerServiceTest.php
│           ├── GitHubServiceTest.php
│           └── CloudflareServiceTest.php
└── docker/
    ├── docker-compose.yml
    ├── docker-compose.prod.yml
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    └── nginx/
        ├── app.conf                           # Config nginx para el frontend
        └── hub.leymaken.com.conf              # Config HestiaCP proxy
```

---

## Task 1: Repo scaffold + Docker base

**Files:**
- Create: `docker/docker-compose.yml`
- Create: `docker/Dockerfile.backend`
- Create: `docker/Dockerfile.frontend`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Inicializar el repo**

```bash
cd C:\Users\MattLpzZ\Downloads\REPOSITORIOS
mkdir leymaken-hub
cd leymaken-hub
git init
```

- [ ] **Step 2: Crear .gitignore**

```
# .gitignore
backend/.env
backend/vendor/
backend/storage/logs/
frontend/node_modules/
frontend/dist/
docker/.env
.env
```

- [ ] **Step 3: Crear .env.example**

```bash
# .env.example — copiar a .env y rellenar valores

# Docker
COMPOSE_PROJECT_NAME=leymaken_hub

# Laravel
APP_KEY=                        # php artisan key:generate
APP_URL=https://hub.leymaken.com
DB_HOST=leymaken_mysql          # container existente en VPS
DB_PORT=3306
DB_DATABASE=leymaken_hub
DB_USERNAME=leymaken
DB_PASSWORD=

# Integraciones
GITHUB_TOKEN=                   # Personal Access Token (repo, read:user)
CLOUDFLARE_TOKEN=               # API Token (Zone:Read, Analytics:Read, Workers:Read)
CLOUDFLARE_ACCOUNT_ID=

# Frontend
VITE_API_URL=https://hub.leymaken.com/api
```

- [ ] **Step 4: Crear docker/Dockerfile.backend**

```dockerfile
FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    git curl libpng-dev libxml2-dev zip unzip \
    && docker-php-ext-install pdo_mysql bcmath gd

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY backend/ .

RUN composer install --no-dev --optimize-autoloader \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]
```

- [ ] **Step 5: Crear docker/Dockerfile.frontend**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx/app.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 6: Crear docker/nginx/app.conf**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://leymaken_hub_api:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

- [ ] **Step 7: Crear docker/docker-compose.yml (desarrollo)**

```yaml
services:
  hub_api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.backend
    container_name: leymaken_hub_api
    volumes:
      - ../backend:/var/www/html
      - /var/run/docker.sock:/var/run/docker.sock  # Docker socket para DockerService
    env_file: ../.env
    networks:
      - leymaken_net

  hub_frontend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.frontend
    container_name: leymaken_hub_frontend
    ports:
      - "3010:80"
    depends_on:
      - hub_api
    networks:
      - leymaken_net

networks:
  leymaken_net:
    external: true   # Red compartida con los otros containers Leymaken
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: repo scaffold + docker base"
```

---

## Task 2: Laravel backend scaffold

**Files:**
- Create: `backend/` (instalación Laravel 12)
- Modify: `backend/config/cors.php`
- Modify: `backend/routes/api.php`
- Create: `backend/database/migrations/..._create_infra_snapshots_table.php`

- [ ] **Step 1: Instalar Laravel 12 en backend/**

```bash
cd C:\Users\MattLpzZ\Downloads\REPOSITORIOS\leymaken-hub
composer create-project laravel/laravel:^12 backend
cd backend
```

- [ ] **Step 2: Instalar dependencias**

```bash
composer require laravel/sanctum guzzlehttp/guzzle
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

- [ ] **Step 3: Configurar .env del backend**

Copiar `.env.example` de la raíz del repo a `backend/.env` y rellenar:
```
APP_NAME="LEYMAKEN HUB"
APP_ENV=local
APP_KEY=      # se genera en Step 4
APP_DEBUG=true
APP_URL=http://localhost:3010

DB_CONNECTION=mysql
DB_HOST=127.0.0.1   # localhost para dev, leymaken_mysql para prod
DB_PORT=3306
DB_DATABASE=leymaken_hub
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:3010

GITHUB_TOKEN=
CLOUDFLARE_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
```

- [ ] **Step 4: Generar key y configurar Sanctum**

```bash
php artisan key:generate
```

Editar `bootstrap/app.php` para agregar Sanctum middleware:
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->statefulApi();
})
```

- [ ] **Step 5: Configurar CORS en config/cors.php**

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:5173', 'https://hub.leymaken.com'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

- [ ] **Step 6: Crear migración infra_snapshots**

```bash
php artisan make:migration create_infra_snapshots_table
```

Editar el archivo generado en `database/migrations/`:
```php
public function up(): void
{
    Schema::create('infra_snapshots', function (Blueprint $table) {
        $table->id();
        $table->string('source');        // 'docker' | 'github' | 'cloudflare'
        $table->json('data');
        $table->timestamp('polled_at');
        $table->timestamps();

        $table->index(['source', 'polled_at']);
    });
}
```

- [ ] **Step 7: Crear tabla y usuario DB**

```bash
# Crear DB leymaken_hub en MySQL local (dev)
mysql -u root -e "CREATE DATABASE IF NOT EXISTS leymaken_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
php artisan migrate
```

- [ ] **Step 8: Definir rutas API en routes/api.php**

```php
<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\InfraController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn($req) => $req->user());

    // Mission Control
    Route::prefix('infra')->group(function () {
        Route::get('/docker',     [InfraController::class, 'docker']);
        Route::get('/github',     [InfraController::class, 'github']);
        Route::get('/cloudflare', [InfraController::class, 'cloudflare']);
        Route::get('/feed',       [InfraController::class, 'feed']);
        Route::post('/docker/{name}/restart', [InfraController::class, 'restartContainer']);
        Route::get('/docker/{name}/logs',     [InfraController::class, 'containerLogs']);
    });
});
```

- [ ] **Step 9: Crear AuthController**

```bash
php artisan make:controller AuthController
```

```php
<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        $user  = $request->user();
        $token = $user->createToken('hub')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'ok']);
    }
}
```

- [ ] **Step 10: Crear usuario admin para dev**

```bash
php artisan tinker
# Dentro de tinker:
\App\Models\User::create([
    'name'     => 'Matt',
    'email'    => 'salopzmatt@gmail.com',
    'password' => bcrypt('password'),
]);
exit
```

- [ ] **Step 11: Commit**

```bash
git add backend/
git commit -m "feat: laravel backend scaffold + auth + infra routes"
```

---

## Task 3: React frontend scaffold

**Files:**
- Create: `frontend/` (Vite + React + TypeScript)
- Create: `frontend/src/index.css`
- Create: `frontend/src/lib/api.ts`

- [ ] **Step 1: Crear proyecto Vite**

```bash
cd C:\Users\MattLpzZ\Downloads\REPOSITORIOS\leymaken-hub
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

- [ ] **Step 2: Instalar dependencias**

```bash
npm install tailwindcss @tailwindcss/vite zustand axios react-router-dom
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
```

- [ ] **Step 3: Configurar vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 4: Crear src/index.css con design system**

```css
@import "tailwindcss";

:root {
  --app-bg:    #030712;
  --surface:   #111827;
  --surface-2: #1f2937;
  --border:    #374151;
  --text-1:    #f9fafb;
  --text-2:    #9ca3af;
  --text-3:    #6b7280;
  --accent:    #10b981;
}

body {
  background: var(--app-bg);
  color: var(--text-1);
  font-family: 'Inter', system-ui, sans-serif;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 1.25rem;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-primary:hover { filter: brightness(1.1); }

.btn-secondary {
  background: var(--surface-2);
  color: var(--text-1);
  border: 1px solid var(--border);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.input {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-1);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  width: 100%;
}

.input:focus {
  outline: none;
  border-color: var(--accent);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-green  { background: #065f4620; color: #34d399; }
.badge-red    { background: #7f1d1d20; color: #f87171; }
.badge-yellow { background: #78350f20; color: #fbbf24; }
.badge-gray   { background: var(--surface-2); color: var(--text-2); }
```

- [ ] **Step 5: Crear src/lib/api.ts**

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hub_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hub_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
```

- [ ] **Step 6: Crear frontend/.env**

```
VITE_API_URL=http://localhost:8000/api
```

- [ ] **Step 7: Verificar que el proyecto arranca**

```bash
cd frontend
npm run dev
```

Esperado: Vite dev server en `http://localhost:5173`

- [ ] **Step 8: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: react frontend scaffold + design system"
```

---

## Task 4: App shell (Layout + Auth)

**Files:**
- Create: `frontend/src/stores/authStore.ts`
- Create: `frontend/src/components/Sidebar.tsx`
- Create: `frontend/src/components/Header.tsx`
- Create: `frontend/src/components/Layout.tsx`
- Create: `frontend/src/modules/auth/LoginPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Crear authStore.ts**

```typescript
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
```

- [ ] **Step 2: Crear Sidebar.tsx**

```typescript
import { useLocation, Link } from 'react-router-dom'
import { LayoutDashboard, Bot, Users, FileText, Settings } from 'lucide-react'
import { useState } from 'react'

const nav = [
  { label: 'Mission Control', icon: LayoutDashboard, href: '/' },
  { label: 'Agente',          icon: Bot,              href: '/agent' },
  { label: 'CRM',             icon: Users,            href: '/crm' },
  { label: 'Facturación',     icon: FileText,         href: '/billing' },
  { label: 'Configuración',   icon: Settings,         href: '/settings' },
]

export function Sidebar() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      style={{ width: collapsed ? 64 : 240, background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      className="h-screen flex flex-col flex-shrink-0 transition-all duration-200"
    >
      <div className="h-16 flex items-center px-4 border-b" style={{ borderColor: 'var(--border)' }}>
        {!collapsed && (
          <span className="font-bold text-sm tracking-widest" style={{ color: 'var(--accent)' }}>
            LEYMAKEN HUB
          </span>
        )}
        <button
          className="ml-auto p-1 rounded hover:bg-gray-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          <LayoutDashboard size={16} style={{ color: 'var(--text-2)' }} />
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {nav.map(({ label, icon: Icon, href }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              to={href}
              className="flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors"
              style={{
                color: active ? 'var(--accent)' : 'var(--text-2)',
                background: active ? '#10b98115' : 'transparent',
              }}
            >
              <Icon size={16} />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Crear Header.tsx**

```typescript
import { useAuthStore } from '@/stores/authStore'

export function Header() {
  const { user, logout } = useAuthStore()

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b flex-shrink-0"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <span style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
        hub.leymaken.com
      </span>
      <div className="flex items-center gap-3">
        <span style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>{user?.name}</span>
        <button className="btn-secondary text-xs" onClick={logout}>Salir</button>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Crear Layout.tsx**

```typescript
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Crear LoginPage.tsx**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuthStore()
  const navigate  = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--app-bg)' }}>
      <div className="card w-full max-w-sm space-y-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--accent)' }}>LEYMAKEN HUB</h1>
        <form onSubmit={submit} className="space-y-4">
          <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Actualizar App.tsx con router**

```typescript
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/modules/auth/LoginPage'
import { MissionControlPage } from '@/modules/mission-control/MissionControlPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="min-h-screen" style={{ background: 'var(--app-bg)' }} />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<MissionControlPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 7: Actualizar main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 8: Crear MissionControlPage.tsx placeholder para que compile**

```typescript
// frontend/src/modules/mission-control/MissionControlPage.tsx
export function MissionControlPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-1)' }}>Mission Control</h1>
      <p style={{ color: 'var(--text-2)' }}>Cargando paneles...</p>
    </div>
  )
}
```

- [ ] **Step 9: Iniciar backend y frontend para verificar login**

```bash
# Terminal 1 — backend
cd backend && php artisan serve --port=8000

# Terminal 2 — frontend
cd frontend && npm run dev
```

Abrir `http://localhost:5173` → debe redirigir a `/login` → login con `salopzmatt@gmail.com` / `password` → debe entrar al layout con sidebar.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: app shell - layout, sidebar, header, auth flow"
```

---

## Task 5: DockerService

**Files:**
- Create: `backend/app/Services/DockerService.php`
- Create: `backend/tests/Unit/DockerServiceTest.php`

El service conecta al Docker socket montado en `/var/run/docker.sock` via HTTP. En dev (sin socket), usa datos mock.

- [ ] **Step 1: Escribir el test primero**

```bash
cd backend
php artisan make:test DockerServiceTest --unit
```

Reemplazar el contenido de `tests/Unit/DockerServiceTest.php`:

```php
<?php
namespace Tests\Unit;

use App\Services\DockerService;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Tests\TestCase;

class DockerServiceTest extends TestCase
{
    private function makeService(array $responses): DockerService
    {
        $mock    = new MockHandler($responses);
        $handler = HandlerStack::create($mock);
        $client  = new Client(['handler' => $handler]);
        return new DockerService($client);
    }

    public function test_list_containers_returns_formatted_array(): void
    {
        $dockerResponse = json_encode([[
            'Id'     => 'abc123',
            'Names'  => ['/leymaken_api'],
            'State'  => 'running',
            'Status' => 'Up 2 hours',
        ]]);

        $service    = $this->makeService([new Response(200, [], $dockerResponse)]);
        $containers = $service->listContainers();

        $this->assertCount(1, $containers);
        $this->assertEquals('leymaken_api', $containers[0]['name']);
        $this->assertEquals('running', $containers[0]['state']);
        $this->assertEquals('Up 2 hours', $containers[0]['status']);
    }

    public function test_get_logs_returns_string(): void
    {
        $service = $this->makeService([new Response(200, [], "log line 1\nlog line 2\n")]);
        $logs    = $service->getLogs('leymaken_api', 50);
        $this->assertStringContainsString('log line 1', $logs);
    }

    public function test_restart_container_returns_true_on_204(): void
    {
        $service = $this->makeService([new Response(204)]);
        $result  = $service->restart('leymaken_api');
        $this->assertTrue($result);
    }

    public function test_restart_container_returns_false_on_error(): void
    {
        $service = $this->makeService([new Response(500)]);
        $result  = $service->restart('leymaken_api');
        $this->assertFalse($result);
    }
}
```

- [ ] **Step 2: Correr el test para verificar que falla**

```bash
php artisan test tests/Unit/DockerServiceTest.php
```

Esperado: FAIL con "Class DockerService not found"

- [ ] **Step 3: Implementar DockerService.php**

```php
<?php
namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class DockerService
{
    private Client $client;

    public function __construct(?Client $client = null)
    {
        $this->client = $client ?? new Client([
            'base_uri' => 'http://localhost',
            'curl'     => [CURLOPT_UNIX_SOCKET_PATH => '/var/run/docker.sock'],
            'timeout'  => 5,
        ]);
    }

    public function listContainers(): array
    {
        try {
            $res  = $this->client->get('/v1.43/containers/json?all=true');
            $raw  = json_decode($res->getBody()->getContents(), true);
            return array_map(fn($c) => [
                'id'     => substr($c['Id'], 0, 12),
                'name'   => ltrim($c['Names'][0] ?? 'unknown', '/'),
                'state'  => $c['State'],
                'status' => $c['Status'],
            ], $raw ?? []);
        } catch (GuzzleException) {
            return [];
        }
    }

    public function getLogs(string $name, int $lines = 100): string
    {
        try {
            $res = $this->client->get("/v1.43/containers/{$name}/logs?stdout=true&stderr=true&tail={$lines}");
            return $res->getBody()->getContents();
        } catch (GuzzleException) {
            return '';
        }
    }

    public function restart(string $name): bool
    {
        try {
            $res = $this->client->post("/v1.43/containers/{$name}/restart");
            return $res->getStatusCode() === 204;
        } catch (GuzzleException) {
            return false;
        }
    }

    public function getStats(string $name): array
    {
        try {
            $res  = $this->client->get("/v1.43/containers/{$name}/stats?stream=false");
            $data = json_decode($res->getBody()->getContents(), true);

            $cpuDelta  = $data['cpu_stats']['cpu_usage']['total_usage'] - $data['precpu_stats']['cpu_usage']['total_usage'];
            $sysDelta  = $data['cpu_stats']['system_cpu_usage'] - $data['precpu_stats']['system_cpu_usage'];
            $numCPUs   = $data['cpu_stats']['online_cpus'] ?? 1;
            $cpuPct    = $sysDelta > 0 ? round(($cpuDelta / $sysDelta) * $numCPUs * 100, 1) : 0;

            $memUsage  = $data['memory_stats']['usage'] ?? 0;
            $memLimit  = $data['memory_stats']['limit'] ?? 1;
            $memPct    = round($memUsage / $memLimit * 100, 1);

            return ['cpu_pct' => $cpuPct, 'mem_pct' => $memPct, 'mem_mb' => round($memUsage / 1024 / 1024, 1)];
        } catch (GuzzleException) {
            return ['cpu_pct' => 0, 'mem_pct' => 0, 'mem_mb' => 0];
        }
    }
}
```

- [ ] **Step 4: Correr tests para verificar que pasan**

```bash
php artisan test tests/Unit/DockerServiceTest.php
```

Esperado: 4 PASSED

- [ ] **Step 5: Commit**

```bash
git add app/Services/DockerService.php tests/Unit/DockerServiceTest.php
git commit -m "feat: DockerService with unix socket + tests"
```

---

## Task 6: GitHubService

**Files:**
- Create: `backend/app/Services/GitHubService.php`
- Create: `backend/tests/Unit/GitHubServiceTest.php`

- [ ] **Step 1: Escribir el test**

```php
<?php
// tests/Unit/GitHubServiceTest.php
namespace Tests\Unit;

use App\Services\GitHubService;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Tests\TestCase;

class GitHubServiceTest extends TestCase
{
    private function makeService(array $responses): GitHubService
    {
        $mock    = new MockHandler($responses);
        $handler = HandlerStack::create($mock);
        $client  = new Client(['handler' => $handler]);
        return new GitHubService($client);
    }

    public function test_list_repos_returns_formatted_array(): void
    {
        $reposJson = json_encode([[
            'name'           => 'leymaken-hub',
            'full_name'      => 'MattLpzZ/leymaken-hub',
            'default_branch' => 'main',
            'updated_at'     => '2026-05-26T10:00:00Z',
            'html_url'       => 'https://github.com/MattLpzZ/leymaken-hub',
        ]]);

        $service = $this->makeService([new Response(200, [], $reposJson)]);
        $repos   = $service->listRepos();

        $this->assertCount(1, $repos);
        $this->assertEquals('leymaken-hub', $repos[0]['name']);
        $this->assertEquals('main', $repos[0]['default_branch']);
    }

    public function test_get_latest_commit_returns_formatted_data(): void
    {
        $commitJson = json_encode([[
            'sha'    => 'abc1234567890',
            'commit' => [
                'message'   => 'feat: add mission control',
                'author'    => ['name' => 'Matt', 'date' => '2026-05-26T10:00:00Z'],
            ],
            'html_url' => 'https://github.com/MattLpzZ/leymaken-hub/commit/abc123',
        ]]);

        $service = $this->makeService([new Response(200, [], $commitJson)]);
        $commit  = $service->getLatestCommit('MattLpzZ', 'leymaken-hub', 'main');

        $this->assertEquals('abc1234', $commit['sha']);
        $this->assertEquals('feat: add mission control', $commit['message']);
        $this->assertEquals('Matt', $commit['author']);
    }
}
```

- [ ] **Step 2: Correr el test para verificar que falla**

```bash
php artisan test tests/Unit/GitHubServiceTest.php
```

Esperado: FAIL con "Class GitHubService not found"

- [ ] **Step 3: Implementar GitHubService.php**

```php
<?php
namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class GitHubService
{
    private Client $client;

    public function __construct(?Client $client = null)
    {
        $token = config('services.github.token');
        $this->client = $client ?? new Client([
            'base_uri' => 'https://api.github.com/',
            'headers'  => [
                'Authorization' => "Bearer {$token}",
                'Accept'        => 'application/vnd.github+json',
                'X-GitHub-Api-Version' => '2022-11-28',
            ],
            'timeout' => 10,
        ]);
    }

    public function listRepos(): array
    {
        try {
            $res  = $this->client->get('user/repos?sort=updated&per_page=20&type=owner');
            $raw  = json_decode($res->getBody()->getContents(), true);
            return array_map(fn($r) => [
                'name'           => $r['name'],
                'full_name'      => $r['full_name'],
                'default_branch' => $r['default_branch'],
                'updated_at'     => $r['updated_at'],
                'html_url'       => $r['html_url'],
            ], $raw ?? []);
        } catch (GuzzleException) {
            return [];
        }
    }

    public function getLatestCommit(string $owner, string $repo, string $branch): array
    {
        try {
            $res    = $this->client->get("repos/{$owner}/{$repo}/commits?sha={$branch}&per_page=1");
            $raw    = json_decode($res->getBody()->getContents(), true);
            $commit = $raw[0] ?? null;
            if (!$commit) return [];
            return [
                'sha'     => substr($commit['sha'], 0, 7),
                'message' => explode("\n", $commit['commit']['message'])[0],
                'author'  => $commit['commit']['author']['name'],
                'date'    => $commit['commit']['author']['date'],
                'url'     => $commit['html_url'],
            ];
        } catch (GuzzleException) {
            return [];
        }
    }
}
```

- [ ] **Step 4: Agregar config en config/services.php**

```php
// Agregar dentro del array de services.php:
'github' => [
    'token' => env('GITHUB_TOKEN'),
],
```

- [ ] **Step 5: Correr tests**

```bash
php artisan test tests/Unit/GitHubServiceTest.php
```

Esperado: 2 PASSED

- [ ] **Step 6: Commit**

```bash
git add app/Services/GitHubService.php tests/Unit/GitHubServiceTest.php config/services.php
git commit -m "feat: GitHubService + tests"
```

---

## Task 7: CloudflareService

**Files:**
- Create: `backend/app/Services/CloudflareService.php`
- Create: `backend/tests/Unit/CloudflareServiceTest.php`

- [ ] **Step 1: Escribir el test**

```php
<?php
// tests/Unit/CloudflareServiceTest.php
namespace Tests\Unit;

use App\Services\CloudflareService;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Tests\TestCase;

class CloudflareServiceTest extends TestCase
{
    private function makeService(array $responses): CloudflareService
    {
        $mock    = new MockHandler($responses);
        $handler = HandlerStack::create($mock);
        $client  = new Client(['handler' => $handler]);
        return new CloudflareService($client);
    }

    public function test_list_zones_returns_formatted_array(): void
    {
        $body = json_encode(['result' => [[
            'id'     => 'zone123',
            'name'   => 'leymaken.com',
            'status' => 'active',
        ]], 'success' => true]);

        $service = $this->makeService([new Response(200, [], $body)]);
        $zones   = $service->listZones();

        $this->assertCount(1, $zones);
        $this->assertEquals('leymaken.com', $zones[0]['name']);
        $this->assertEquals('active', $zones[0]['status']);
    }

    public function test_list_workers_returns_formatted_array(): void
    {
        $body = json_encode(['result' => [
            ['id' => 'licorlab-web', 'created_on' => '2026-01-01T00:00:00Z', 'modified_on' => '2026-05-20T10:00:00Z'],
        ], 'success' => true]);

        $service = $this->makeService([new Response(200, [], $body)]);
        $workers = $service->listWorkers('account123');

        $this->assertCount(1, $workers);
        $this->assertEquals('licorlab-web', $workers[0]['id']);
    }
}
```

- [ ] **Step 2: Correr el test para verificar que falla**

```bash
php artisan test tests/Unit/CloudflareServiceTest.php
```

Esperado: FAIL

- [ ] **Step 3: Implementar CloudflareService.php**

```php
<?php
namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class CloudflareService
{
    private Client $client;

    public function __construct(?Client $client = null)
    {
        $token = config('services.cloudflare.token');
        $this->client = $client ?? new Client([
            'base_uri' => 'https://api.cloudflare.com/client/v4/',
            'headers'  => [
                'Authorization' => "Bearer {$token}",
                'Content-Type'  => 'application/json',
            ],
            'timeout' => 10,
        ]);
    }

    public function listZones(): array
    {
        try {
            $res  = $this->client->get('zones?per_page=50');
            $data = json_decode($res->getBody()->getContents(), true);
            return array_map(fn($z) => [
                'id'     => $z['id'],
                'name'   => $z['name'],
                'status' => $z['status'],
            ], $data['result'] ?? []);
        } catch (GuzzleException) {
            return [];
        }
    }

    public function getZoneAnalytics(string $zoneId): array
    {
        try {
            $since = urlencode(now()->subHours(24)->toISOString());
            $until = urlencode(now()->toISOString());
            $res   = $this->client->get("zones/{$zoneId}/analytics/dashboard?since={$since}&until={$until}&continuous=true");
            $data  = json_decode($res->getBody()->getContents(), true);
            $totals = $data['result']['totals'] ?? [];
            return [
                'requests'  => $totals['requests']['all'] ?? 0,
                'bandwidth' => $totals['bandwidth']['all'] ?? 0,
                'threats'   => $totals['threats']['all'] ?? 0,
            ];
        } catch (GuzzleException) {
            return ['requests' => 0, 'bandwidth' => 0, 'threats' => 0];
        }
    }

    public function listWorkers(string $accountId): array
    {
        try {
            $res  = $this->client->get("accounts/{$accountId}/workers/scripts");
            $data = json_decode($res->getBody()->getContents(), true);
            return array_map(fn($w) => [
                'id'          => $w['id'],
                'modified_on' => $w['modified_on'],
                'created_on'  => $w['created_on'],
            ], $data['result'] ?? []);
        } catch (GuzzleException) {
            return [];
        }
    }
}
```

- [ ] **Step 4: Agregar config en config/services.php**

```php
'cloudflare' => [
    'token'      => env('CLOUDFLARE_TOKEN'),
    'account_id' => env('CLOUDFLARE_ACCOUNT_ID'),
],
```

- [ ] **Step 5: Correr tests**

```bash
php artisan test tests/Unit/CloudflareServiceTest.php
```

Esperado: 2 PASSED

- [ ] **Step 6: Commit**

```bash
git add app/Services/CloudflareService.php tests/Unit/CloudflareServiceTest.php
git commit -m "feat: CloudflareService + tests"
```

---

## Task 8: InfraController + PollInfraJob

**Files:**
- Create: `backend/app/Http/Controllers/InfraController.php`
- Create: `backend/app/Jobs/PollInfraJob.php`
- Create: `backend/tests/Feature/InfraControllerTest.php`

- [ ] **Step 1: Escribir el test de feature**

```bash
php artisan make:test InfraControllerTest
```

```php
<?php
// tests/Feature/InfraControllerTest.php
namespace Tests\Feature;

use App\Models\User;
use App\Services\DockerService;
use App\Services\GitHubService;
use App\Services\CloudflareService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InfraControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_docker_endpoint_requires_auth(): void
    {
        $res = $this->getJson('/api/infra/docker');
        $res->assertStatus(401);
    }

    public function test_docker_endpoint_returns_containers(): void
    {
        $this->mock(DockerService::class, function ($mock) {
            $mock->shouldReceive('listContainers')->once()->andReturn([
                ['id' => 'abc123', 'name' => 'leymaken_api', 'state' => 'running', 'status' => 'Up 2h'],
            ]);
        });

        $res = $this->actingAs($this->user)->getJson('/api/infra/docker');
        $res->assertOk()->assertJsonPath('containers.0.name', 'leymaken_api');
    }

    public function test_github_endpoint_returns_repos(): void
    {
        $this->mock(GitHubService::class, function ($mock) {
            $mock->shouldReceive('listRepos')->once()->andReturn([
                ['name' => 'leymaken-hub', 'full_name' => 'MattLpzZ/leymaken-hub', 'default_branch' => 'main', 'updated_at' => '2026-05-26', 'html_url' => 'https://github.com/MattLpzZ/leymaken-hub'],
            ]);
            $mock->shouldReceive('getLatestCommit')->once()->andReturn([
                'sha' => 'abc1234', 'message' => 'feat: init', 'author' => 'Matt', 'date' => '2026-05-26T10:00:00Z', 'url' => '#',
            ]);
        });

        $res = $this->actingAs($this->user)->getJson('/api/infra/github');
        $res->assertOk()->assertJsonPath('repos.0.name', 'leymaken-hub');
    }

    public function test_restart_container_endpoint(): void
    {
        $this->mock(DockerService::class, function ($mock) {
            $mock->shouldReceive('restart')->with('leymaken_api')->once()->andReturn(true);
        });

        $res = $this->actingAs($this->user)->postJson('/api/infra/docker/leymaken_api/restart');
        $res->assertOk()->assertJson(['ok' => true]);
    }
}
```

- [ ] **Step 2: Correr el test para verificar que falla**

```bash
php artisan test tests/Feature/InfraControllerTest.php
```

Esperado: FAIL

- [ ] **Step 3: Implementar InfraController.php**

```bash
php artisan make:controller InfraController
```

```php
<?php
namespace App\Http\Controllers;

use App\Services\DockerService;
use App\Services\GitHubService;
use App\Services\CloudflareService;
use App\Models\InfraSnapshot;
use Illuminate\Http\JsonResponse;

class InfraController extends Controller
{
    public function __construct(
        private DockerService     $docker,
        private GitHubService     $github,
        private CloudflareService $cloudflare,
    ) {}

    public function docker(): JsonResponse
    {
        $containers = $this->docker->listContainers();
        return response()->json(['containers' => $containers, 'polled_at' => now()->toISOString()]);
    }

    public function github(): JsonResponse
    {
        $repos = $this->github->listRepos();
        $repos = array_map(function ($repo) {
            [$owner, $name] = explode('/', $repo['full_name']);
            $repo['latest_commit'] = $this->github->getLatestCommit($owner, $name, $repo['default_branch']);
            return $repo;
        }, array_slice($repos, 0, 10));

        return response()->json(['repos' => $repos, 'polled_at' => now()->toISOString()]);
    }

    public function cloudflare(): JsonResponse
    {
        $accountId = config('services.cloudflare.account_id');
        $zones     = $this->cloudflare->listZones();
        $zones     = array_map(function ($zone) {
            $zone['analytics'] = $this->cloudflare->getZoneAnalytics($zone['id']);
            return $zone;
        }, $zones);
        $workers = $this->cloudflare->listWorkers($accountId);

        return response()->json(['zones' => $zones, 'workers' => $workers, 'polled_at' => now()->toISOString()]);
    }

    public function feed(): JsonResponse
    {
        // Muestra el último snapshot de cada fuente como "eventos" de actividad
        $events = [];
        foreach (['docker', 'github', 'cloudflare'] as $source) {
            $snap = InfraSnapshot::where('source', $source)->latest('polled_at')->first();
            if (!$snap) continue;
            $count = match($source) {
                'docker'     => count($snap->data['containers'] ?? []) . ' containers',
                'github'     => count($snap->data['repos'] ?? []) . ' repos',
                'cloudflare' => count($snap->data['zones'] ?? []) . ' zones, ' . count($snap->data['workers'] ?? []) . ' workers',
            };
            $events[] = [
                'source'    => $source,
                'message'   => "Polled {$source}: {$count}",
                'timestamp' => $snap->polled_at->toISOString(),
            ];
        }

        return response()->json(['events' => $events]);
    }

    public function restartContainer(string $name): JsonResponse
    {
        $ok = $this->docker->restart($name);
        return response()->json(['ok' => $ok], $ok ? 200 : 500);
    }

    public function containerLogs(string $name): JsonResponse
    {
        $lines = request()->integer('lines', 100);
        $logs  = $this->docker->getLogs($name, $lines);
        return response()->json(['logs' => $logs]);
    }
}
```

- [ ] **Step 4: Crear modelo InfraSnapshot**

```bash
php artisan make:model InfraSnapshot
```

```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InfraSnapshot extends Model
{
    protected $fillable = ['source', 'data', 'polled_at'];
    protected $casts    = ['data' => 'array', 'polled_at' => 'datetime'];
}
```

- [ ] **Step 5: Crear PollInfraJob.php**

```bash
php artisan make:job PollInfraJob
```

```php
<?php
namespace App\Jobs;

use App\Models\InfraSnapshot;
use App\Services\DockerService;
use App\Services\GitHubService;
use App\Services\CloudflareService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class PollInfraJob implements ShouldQueue
{
    use Queueable;

    public function handle(DockerService $docker, GitHubService $github, CloudflareService $cloudflare): void
    {
        $sources = [
            'docker'     => fn() => ['containers' => $docker->listContainers()],
            'github'     => fn() => ['repos' => $github->listRepos()],
            'cloudflare' => fn() => ['zones' => $cloudflare->listZones(), 'workers' => $cloudflare->listWorkers(config('services.cloudflare.account_id'))],
        ];

        foreach ($sources as $source => $fetch) {
            InfraSnapshot::create([
                'source'     => $source,
                'data'       => $fetch(),
                'polled_at'  => now(),
            ]);
        }

        // Limpiar snapshots de más de 24h
        InfraSnapshot::where('polled_at', '<', now()->subDay())->delete();
    }
}
```

- [ ] **Step 6: Registrar el job en el scheduler (app/Console/Kernel.php o bootstrap/app.php)**

En `routes/console.php`:
```php
use App\Jobs\PollInfraJob;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new PollInfraJob)->everyMinute();
```

- [ ] **Step 7: Correr tests**

```bash
php artisan test tests/Feature/InfraControllerTest.php
```

Esperado: 4 PASSED

- [ ] **Step 8: Correr todos los tests**

```bash
php artisan test
```

Esperado: todos PASSED

- [ ] **Step 9: Commit**

```bash
git add app/Http/Controllers/InfraController.php app/Jobs/PollInfraJob.php app/Models/InfraSnapshot.php tests/Feature/InfraControllerTest.php routes/console.php
git commit -m "feat: InfraController + PollInfraJob + InfraSnapshot model"
```

---

## Task 9: Mission Control UI

**Files:**
- Create: `frontend/src/stores/infraStore.ts`
- Create: `frontend/src/modules/mission-control/InfraOverview.tsx`
- Create: `frontend/src/modules/mission-control/GitHubFeed.tsx`
- Create: `frontend/src/modules/mission-control/CloudflarePanel.tsx`
- Create: `frontend/src/modules/mission-control/LiveFeed.tsx`
- Modify: `frontend/src/modules/mission-control/MissionControlPage.tsx`

- [ ] **Step 1: Crear infraStore.ts**

```typescript
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
```

- [ ] **Step 2: Crear InfraOverview.tsx**

```typescript
import { useEffect } from 'react'
import { useInfraStore } from '@/stores/infraStore'
import { RefreshCw } from 'lucide-react'

export function InfraOverview() {
  const { containers, loading, fetchDocker, restartContainer } = useInfraStore()

  useEffect(() => { fetchDocker() }, [])

  const stateColor = (state: string) =>
    state === 'running' ? 'badge-green' : state === 'exited' ? 'badge-red' : 'badge-yellow'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Docker — VPS</h2>
        <button className="btn-secondary text-xs flex items-center gap-1" onClick={fetchDocker}>
          <RefreshCw size={12} className={loading.docker ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading.docker && !containers.length ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Cargando...</p>
      ) : (
        <div className="space-y-2">
          {containers.map(c => (
            <div key={c.id} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--surface-2)' }}>
              <div>
                <span className="text-sm font-mono" style={{ color: 'var(--text-1)' }}>{c.name}</span>
                <span className="text-xs ml-2" style={{ color: 'var(--text-3)' }}>{c.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${stateColor(c.state)}`}>{c.state}</span>
                {c.state !== 'running' && (
                  <button className="btn-secondary text-xs" onClick={() => restartContainer(c.name)}>
                    Reiniciar
                  </button>
                )}
              </div>
            </div>
          ))}
          {!containers.length && <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin containers</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Crear GitHubFeed.tsx**

```typescript
import { useEffect } from 'react'
import { useInfraStore } from '@/stores/infraStore'
import { GitBranch, ExternalLink } from 'lucide-react'

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export function GitHubFeed() {
  const { repos, loading, fetchGithub } = useInfraStore()
  useEffect(() => { fetchGithub() }, [])

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>GitHub</h2>
        <span className="badge badge-gray">{repos.length} repos</span>
      </div>

      {loading.github && !repos.length ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Cargando...</p>
      ) : (
        <div className="space-y-3">
          {repos.slice(0, 8).map(r => (
            <div key={r.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{r.name}</span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                    <GitBranch size={10} /> {r.default_branch}
                  </span>
                </div>
                <a href={r.html_url} target="_blank" rel="noreferrer">
                  <ExternalLink size={12} style={{ color: 'var(--text-3)' }} />
                </a>
              </div>
              {r.latest_commit && (
                <p className="text-xs truncate" style={{ color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--text-3)' }}>{r.latest_commit.sha} · </span>
                  {r.latest_commit.message}
                  <span style={{ color: 'var(--text-3)' }}> · {timeAgo(r.latest_commit.date)}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Crear CloudflarePanel.tsx**

```typescript
import { useEffect } from 'react'
import { useInfraStore } from '@/stores/infraStore'
import { Globe, Zap } from 'lucide-react'

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n/1000).toFixed(1)}K`
  return String(n)
}

export function CloudflarePanel() {
  const { zones, workers, loading, fetchCloudflare } = useInfraStore()
  useEffect(() => { fetchCloudflare() }, [])

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Cloudflare</h2>
        <div className="flex gap-2">
          <span className="badge badge-gray">{zones.length} zones</span>
          <span className="badge badge-gray">{workers.length} workers</span>
        </div>
      </div>

      {loading.cloudflare && !zones.length ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Cargando...</p>
      ) : (
        <div className="space-y-3">
          {zones.map(z => (
            <div key={z.id} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--surface-2)' }}>
              <div className="flex items-center gap-2">
                <Globe size={12} style={{ color: 'var(--text-3)' }} />
                <span className="text-sm" style={{ color: 'var(--text-1)' }}>{z.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {z.analytics && (
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {formatNum(z.analytics.requests)} req/24h
                  </span>
                )}
                <span className={`badge ${z.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>{z.status}</span>
              </div>
            </div>
          ))}

          {workers.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>Workers & Pages</p>
              <div className="space-y-1">
                {workers.map(w => (
                  <div key={w.id} className="flex items-center gap-2">
                    <Zap size={10} style={{ color: 'var(--text-3)' }} />
                    <span className="text-xs font-mono" style={{ color: 'var(--text-2)' }}>{w.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Crear LiveFeed.tsx**

```typescript
import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Event { source: string; type: string; message: string; timestamp: string }

export function LiveFeed() {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    api.get('/infra/feed').then(r => setEvents(r.data.events ?? []))
    const interval = setInterval(() => {
      api.get('/infra/feed').then(r => setEvents(r.data.events ?? []))
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const sourceColor: Record<string, string> = {
    docker: '#10b981', github: '#6366f1', cloudflare: '#f59e0b',
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-1)' }}>Live Feed</h2>
      {events.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin eventos recientes</p>
      ) : (
        <div className="space-y-2">
          {events.slice(0, 20).map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: sourceColor[e.source] ?? 'var(--text-3)' }} />
              <span style={{ color: 'var(--text-2)' }}>{e.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Actualizar MissionControlPage.tsx**

```typescript
import { InfraOverview }   from './InfraOverview'
import { GitHubFeed }      from './GitHubFeed'
import { CloudflarePanel } from './CloudflarePanel'
import { LiveFeed }        from './LiveFeed'

export function MissionControlPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-1)' }}>Mission Control</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <InfraOverview />
        <GitHubFeed />
        <CloudflarePanel />
        <div className="lg:col-span-2 xl:col-span-3">
          <LiveFeed />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Verificar compilación sin errores**

```bash
cd frontend && npm run build
```

Esperado: build exitoso sin errores de TypeScript

- [ ] **Step 9: Commit**

```bash
git add frontend/src/
git commit -m "feat: Mission Control UI - infra, github, cloudflare, live feed"
```

---

## Task 10: Deploy al VPS

**Files:**
- Create: `docker/docker-compose.prod.yml`
- Create: `docker/nginx/hub.leymaken.com.conf`

- [ ] **Step 1: Crear docker-compose.prod.yml**

```yaml
services:
  hub_api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.backend
    container_name: leymaken_hub_api
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - hub_storage:/var/www/html/storage
    environment:
      APP_ENV: production
      APP_DEBUG: "false"
    env_file: ../.env
    networks:
      - leymaken_net

  hub_worker:
    build:
      context: ..
      dockerfile: docker/Dockerfile.backend
    container_name: leymaken_hub_worker
    restart: unless-stopped
    command: php artisan queue:work --sleep=3 --tries=3
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - hub_storage:/var/www/html/storage
    env_file: ../.env
    networks:
      - leymaken_net

  hub_scheduler:
    build:
      context: ..
      dockerfile: docker/Dockerfile.backend
    container_name: leymaken_hub_scheduler
    restart: unless-stopped
    command: sh -c "while true; do php artisan schedule:run; sleep 60; done"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    env_file: ../.env
    networks:
      - leymaken_net

  hub_frontend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.frontend
    container_name: leymaken_hub_frontend
    restart: unless-stopped
    networks:
      - leymaken_net

volumes:
  hub_storage:

networks:
  leymaken_net:
    external: true
```

- [ ] **Step 2: Crear nginx proxy config para HestiaCP**

```nginx
# docker/nginx/hub.leymaken.com.conf
# Agregar este bloque al nginx de HestiaCP para hub.leymaken.com
location / {
    proxy_pass         http://leymaken_hub_frontend:80;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection 'upgrade';
    proxy_set_header   Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

- [ ] **Step 3: Configurar .env de producción en VPS**

En el VPS, crear `/opt/leymaken-hub/.env` con:
```
APP_ENV=production
APP_KEY=          # php artisan key:generate
APP_URL=https://hub.leymaken.com
DB_HOST=leymaken_mysql
DB_DATABASE=leymaken_hub
DB_USERNAME=leymaken
DB_PASSWORD=<password del VPS>
GITHUB_TOKEN=<tu PAT>
CLOUDFLARE_TOKEN=<tu API token>
CLOUDFLARE_ACCOUNT_ID=<tu account ID>
VITE_API_URL=https://hub.leymaken.com/api
```

- [ ] **Step 4: Deploy inicial al VPS**

```bash
# En el VPS (via SSH)
cd /opt
git clone https://github.com/MattLpzZ/leymaken-hub.git
cd leymaken-hub

# Crear la BD en MySQL
docker exec leymaken_mysql mysql -u leymaken -p<pass> -e \
  "CREATE DATABASE IF NOT EXISTS leymaken_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Build y levantar
docker compose -f docker/docker-compose.prod.yml build
docker compose -f docker/docker-compose.prod.yml up -d

# Migrate
docker exec leymaken_hub_api php artisan migrate --force
docker exec leymaken_hub_api php artisan optimize

# Crear usuario admin en producción
docker exec -it leymaken_hub_api php artisan tinker
# \App\Models\User::create(['name'=>'Matt','email'=>'salopzmatt@gmail.com','password'=>bcrypt('<contraseña segura>')]);
```

- [ ] **Step 5: Verificar que el Hub está en pie**

Abrir `https://hub.leymaken.com` → debe mostrar la pantalla de login.
Login → debe mostrar el Mission Control con los datos de infra.

- [ ] **Step 6: Commit final**

```bash
git add docker/
git commit -m "feat: production docker compose + nginx config"
git push origin main
```

---

## Resumen de tests a pasar antes de deploy

```bash
cd backend && php artisan test
```

Esperado:
```
PASS Tests\Unit\DockerServiceTest        (4 tests)
PASS Tests\Unit\GitHubServiceTest        (2 tests)
PASS Tests\Unit\CloudflareServiceTest    (2 tests)
PASS Tests\Feature\InfraControllerTest   (4 tests)
```

Total: 12 tests, 12 passed.

---

## Próximos planes (fases siguientes)

- `2026-XX-XX-phase2-ai-agent.md` — AgentService + Chat UI + Vault + Tool Use
- `2026-XX-XX-phase3-business-migration.md` — CRM + CMM + Finance + Billing + SaaS
- `2026-XX-XX-phase4-platform-layer.md` — Workers manager + WhatsApp agents (OpenWA)
