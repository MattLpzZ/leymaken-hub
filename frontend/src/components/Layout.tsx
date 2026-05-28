import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ActivityTicker } from './ActivityTicker'
import { Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 pb-8">
          <Outlet />
        </main>
      </div>
      <ActivityTicker />
    </div>
  )
}
