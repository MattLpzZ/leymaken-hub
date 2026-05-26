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
  const init = useAuthStore((s: { init: () => Promise<void> }) => s.init)
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
