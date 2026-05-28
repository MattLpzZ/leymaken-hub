import { useState, createContext, useContext } from 'react'
import clsx from 'clsx'

interface TabsContextValue {
  active: string
  setActive: (id: string) => void
}
const TabsContext = createContext<TabsContextValue>({ active: '', setActive: () => {} })

interface TabsProps {
  defaultTab: string
  children: React.ReactNode
  className?: string
}

export function Tabs({ defaultTab, children, className }: TabsProps) {
  const [active, setActive] = useState(defaultTab)

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={clsx('flex flex-col gap-4', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

interface TabListProps { children: React.ReactNode }
export function TabList({ children }: TabListProps) {
  return (
    <div className="flex gap-1 p-1 rounded-lg w-fit"
      style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

interface TabProps {
  id: string
  label: string
  icon?: React.ReactNode
}
export function Tab({ id, label, icon }: TabProps) {
  const { active, setActive } = useContext(TabsContext)
  const isActive = active === id
  return (
    <button
      onClick={() => setActive(id)}
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
        isActive
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

interface TabPanelProps {
  id: string
  children: React.ReactNode
}
export function TabPanel({ id, children }: TabPanelProps) {
  const { active } = useContext(TabsContext)
  if (active !== id) return null
  return <div>{children}</div>
}
