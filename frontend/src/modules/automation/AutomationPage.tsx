import { ExternalLink, Workflow, MessageSquare } from 'lucide-react'
import { Tabs, TabList, Tab, TabPanel } from '@/components/Tabs'
import WhatsAppBotsTab from './tabs/WhatsAppBotsTab'

const N8N_URL = 'https://n8n.leymaken.com'

function WorkflowsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>Workflows N8N</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Automatizaciones en n8n.leymaken.com</p>
        </div>
        <a
          href={N8N_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <ExternalLink size={13} /> Abrir en nueva pestaña
        </a>
      </div>
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)', height: 'calc(100vh - 220px)' }}>
        <iframe
          src={N8N_URL}
          className="w-full h-full"
          title="N8N Workflows"
        />
      </div>
    </div>
  )
}

export default function AutomationPage() {
  return (
    <Tabs defaultTab="workflows">
      <TabList>
        <Tab id="workflows" label="Workflows" icon={<Workflow size={14} />} />
        <Tab id="bots" label="WhatsApp Bots" icon={<MessageSquare size={14} />} />
      </TabList>
      <TabPanel id="workflows"><WorkflowsTab /></TabPanel>
      <TabPanel id="bots"><WhatsAppBotsTab /></TabPanel>
    </Tabs>
  )
}
