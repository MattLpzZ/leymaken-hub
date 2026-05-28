import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useBizAuthStore } from '@/stores/bizAuthStore'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/modules/auth/LoginPage'
import { MissionControlPage } from '@/modules/mission-control/MissionControlPage'
import { CrmPage }      from '@/modules/crm/CrmPage'
import { BillingPage }  from '@/modules/billing/BillingPage'
import { SettingsPage } from '@/modules/settings/SettingsPage'
import AgendaPage       from '@/modules/agenda/AgendaPage'
import CajaPage         from '@/modules/caja/CajaPage'
import StatusPage       from '@/modules/status/StatusPage'
import AutomationPage   from '@/modules/automation/AutomationPage'
import FinancePage      from '@/modules/finance/FinancePage'
import ProjectsPage     from '@/modules/projects/ProjectsPage'
import { SuitePage }    from '@/modules/suite/SuitePage'
import { UbicadoPage }  from '@/modules/ubicado/UbicadoPage'
import { InfraPage }    from '@/modules/infra/InfraPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="min-h-screen" style={{ background: 'var(--app-bg)' }} />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const init        = useAuthStore((s: { init: () => Promise<void> }) => s.init)
  const autoConnect = useBizAuthStore((s) => s.autoConnect)

  useEffect(() => {
    init().then(() => {
      const { user } = useAuthStore.getState()
      if (user && !useBizAuthStore.getState().token) autoConnect()
    })
  }, [init, autoConnect])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index             element={<MissionControlPage />} />
          <Route path="clientes"   element={<CrmPage />} />
          <Route path="crm"        element={<Navigate to="/clientes" replace />} />
          <Route path="billing"    element={<BillingPage />} />
          <Route path="projects"   element={<ProjectsPage />} />
          <Route path="agenda"     element={<AgendaPage />} />
          <Route path="automation" element={<AutomationPage />} />
          <Route path="caja"       element={<CajaPage />} />
          <Route path="finance"    element={<FinancePage />} />
          <Route path="infra"      element={<InfraPage />} />
          <Route path="status"     element={<StatusPage />} />
          <Route path="suite"      element={<SuitePage />} />
          <Route path="ubicado"    element={<UbicadoPage />} />
          <Route path="settings"   element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
