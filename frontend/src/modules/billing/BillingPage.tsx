import { LayoutDashboard, FileText, ClipboardList, Package, Users, Tag, Repeat2, Building2, BarChart3 } from 'lucide-react'
import { Tabs, TabList, Tab, TabPanel } from '@/components/Tabs'
import BillingDashboard from './tabs/BillingDashboard'
import Invoices from './tabs/Invoices'
import Quotes from './tabs/Quotes'
import ServiceCatalog from './tabs/ServiceCatalog'
import Clients from './tabs/Clients'
import Categories from './tabs/Categories'
import Subscriptions from '../finance/tabs/Subscriptions'
import AccountView from './tabs/AccountView'
import ReportsTab from './tabs/ReportsTab'

export function BillingPage() {
  return (
    <Tabs defaultTab="dashboard">
      <TabList>
        <Tab id="dashboard"     label="Dashboard"     icon={<LayoutDashboard size={14} />} />
        <Tab id="invoices"      label="Facturas"      icon={<FileText size={14} />} />
        <Tab id="quotes"        label="Cotizaciones"  icon={<ClipboardList size={14} />} />
        <Tab id="subscriptions" label="Suscripciones" icon={<Repeat2 size={14} />} />
        <Tab id="clients"       label="Clientes"      icon={<Users size={14} />} />
        <Tab id="catalog"       label="Servicios"     icon={<Package size={14} />} />
        <Tab id="categories"    label="Categorías"    icon={<Tag size={14} />} />
        <Tab id="accounts"      label="Cuentas"       icon={<Building2 size={14} />} />
        <Tab id="reports"       label="Reportes"      icon={<BarChart3 size={14} />} />
      </TabList>
      <TabPanel id="dashboard">     <BillingDashboard /> </TabPanel>
      <TabPanel id="invoices">      <Invoices /> </TabPanel>
      <TabPanel id="quotes">        <Quotes /> </TabPanel>
      <TabPanel id="subscriptions"> <Subscriptions /> </TabPanel>
      <TabPanel id="clients">       <Clients /> </TabPanel>
      <TabPanel id="catalog">       <ServiceCatalog /> </TabPanel>
      <TabPanel id="categories">    <Categories /> </TabPanel>
      <TabPanel id="accounts">      <AccountView type="brand" /> </TabPanel>
      <TabPanel id="reports">       <ReportsTab /> </TabPanel>
    </Tabs>
  )
}
