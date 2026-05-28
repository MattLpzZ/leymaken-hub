import { useEffect, useState } from 'react'
import { CalendarDays, LayoutList, Lightbulb } from 'lucide-react'
import { Tabs, TabList, Tab, TabPanel } from '@/components/Tabs'
import { CmmService, type CmmClient, type CmmPostTipo } from '@/lib/services/cmm.service'
import CalendarTab from './tabs/CalendarTab'
import PostsTab from './tabs/PostsTab'
import IdeasTab from './tabs/IdeasTab'

// ── Shared constants ──────────────────────────────────────────────────────────

export const TIPOS: { value: CmmPostTipo; label: string; color: string }[] = [
  { value: 'educativo',       label: 'Educativo',       color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  { value: 'promocional',     label: 'Promocional',     color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  { value: 'entretenimiento', label: 'Entretenimiento', color: 'bg-pink-500/15 text-pink-400 border-pink-500/20' },
  { value: 'behind_scenes',   label: 'Behind the scenes', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
  { value: 'tendencia',       label: 'Tendencia',       color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  { value: 'anuncio',         label: 'Anuncio',         color: 'bg-red-500/15 text-red-400 border-red-500/20' },
]

export function tipoBadge(tipo: CmmPostTipo | null | undefined): string {
  if (!tipo) return 'bg-gray-500/15 text-gray-400 border-gray-500/20'
  return TIPOS.find(t => t.value === tipo)?.color ?? 'bg-gray-500/15 text-gray-400 border-gray-500/20'
}

export function tipoLabel(tipo: CmmPostTipo | null | undefined): string {
  if (!tipo) return '—'
  return TIPOS.find(t => t.value === tipo)?.label ?? tipo
}

// ── Module ────────────────────────────────────────────────────────────────────

export function CmmPage() {
  const [clients, setClients] = useState<CmmClient[]>([])

  useEffect(() => {
    CmmService.clients().then(setClients).catch(() => {})
  }, [])

  return (
    <Tabs defaultTab="calendar">
      <TabList>
        <Tab id="calendar" label="Calendario"    icon={<CalendarDays size={14} />} />
        <Tab id="posts"    label="Publicaciones" icon={<LayoutList   size={14} />} />
        <Tab id="ideas"    label="Ideas"         icon={<Lightbulb    size={14} />} />
      </TabList>

      <TabPanel id="calendar">
        <CalendarTab clients={clients} />
      </TabPanel>

      <TabPanel id="posts">
        <PostsTab clients={clients} />
      </TabPanel>

      <TabPanel id="ideas">
        <IdeasTab clients={clients} />
      </TabPanel>
    </Tabs>
  )
}
