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
      if (!useBizAuthStore.getState().token) autoConnect()
    })
  }, [init, autoConnect])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index         element={<MissionControlPage />} />
          <Route path="crm"      element={<CrmPage />} />
          <Route path="billing"  element={<BillingPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
