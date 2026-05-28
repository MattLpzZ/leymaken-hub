import { User, Upload, CalendarClock, Receipt } from 'lucide-react'
import { Tabs, TabList, Tab, TabPanel } from '@/components/Tabs'
import AccountView from './tabs/AccountView'
import ImportTab from './tabs/ImportTab'
import Scheduled from './tabs/Scheduled'
import GastosFijos from './tabs/GastosFijos'

export default function FinancePage() {
  return (
    <Tabs defaultTab="personal">
      <TabList>
        <Tab id="personal"      label="Personal"      icon={<User size={14} />} />
        <Tab id="gastos-fijos"  label="Gastos Fijos"  icon={<Receipt size={14} />} />
        <Tab id="scheduled"     label="Programados"   icon={<CalendarClock size={14} />} />
        <Tab id="import"        label="Importar"      icon={<Upload size={14} />} />
      </TabList>
      <TabPanel id="personal">      <AccountView type="personal" /> </TabPanel>
      <TabPanel id="gastos-fijos">  <GastosFijos /> </TabPanel>
      <TabPanel id="scheduled">     <Scheduled /> </TabPanel>
      <TabPanel id="import">        <ImportTab /> </TabPanel>
    </Tabs>
  )
}
