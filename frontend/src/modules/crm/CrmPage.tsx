import { Kanban, Users2, CheckCircle2 } from 'lucide-react'
import { Tabs, TabList, Tab, TabPanel } from '@/components/Tabs'
import Pipeline from './tabs/Pipeline'
import Leads from './tabs/Leads'
import ActiveClients from './tabs/ActiveClients'

export function CrmPage() {
  return (
    <Tabs defaultTab="activos">
      <TabList>
        <Tab id="activos"   label="Activos"    icon={<CheckCircle2 size={14} />} />
        <Tab id="pipeline"  label="Pipeline"   icon={<Kanban size={14} />} />
        <Tab id="leads"     label="Contactos"  icon={<Users2 size={14} />} />
      </TabList>
      <TabPanel id="activos">  <ActiveClients /> </TabPanel>
      <TabPanel id="pipeline"> <Pipeline /> </TabPanel>
      <TabPanel id="leads">    <Leads /> </TabPanel>
    </Tabs>
  )
}
