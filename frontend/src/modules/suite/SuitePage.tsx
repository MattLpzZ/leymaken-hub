import { Building2, CreditCard, LayoutGrid, Layers, Key } from 'lucide-react'
import { Tabs, TabList, Tab, TabPanel } from '@/components/Tabs'
import { SuiteCompanies } from './tabs/SuiteCompanies'
import { SuiteSubscriptions } from './tabs/SuiteSubscriptions'
import { SuitePlans } from './tabs/SuitePlans'
import { SuiteSuites } from './tabs/SuiteSuites'
import { ApiKeysTab } from './tabs/ApiKeysTab'

export function SuitePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Layers size={18} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Leymaken Suite</h1>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Gestión de empresas, planes y suscripciones SaaS</p>
        </div>
        <span className="ml-auto badge badge-green text-[10px] px-2 py-0.5">SaaS Admin</span>
      </div>

      <Tabs defaultTab="companies">
        <TabList>
          <Tab id="companies"     label="Empresas"       icon={<Building2 size={14} />} />
          <Tab id="subscriptions" label="Suscripciones"  icon={<CreditCard size={14} />} />
          <Tab id="plans"         label="Planes"         icon={<LayoutGrid size={14} />} />
          <Tab id="suites"        label="Suites"         icon={<Layers size={14} />} />
          <Tab id="apikeys"       label="API Keys"       icon={<Key size={14} />} />
        </TabList>
        <TabPanel id="companies">     <SuiteCompanies /> </TabPanel>
        <TabPanel id="subscriptions"> <SuiteSubscriptions /> </TabPanel>
        <TabPanel id="plans">         <SuitePlans /> </TabPanel>
        <TabPanel id="suites">        <SuiteSuites /> </TabPanel>
        <TabPanel id="apikeys">       <ApiKeysTab /> </TabPanel>
      </Tabs>
    </div>
  )
}
