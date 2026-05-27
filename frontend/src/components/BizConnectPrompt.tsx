import { Link } from 'react-router-dom'
import { PlugZap } from 'lucide-react'

export function BizConnectPrompt() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'var(--text-3)' }}>
      <PlugZap size={40} strokeWidth={1.2} />
      <p className="text-sm">No conectado a soymatt-platform</p>
      <Link to="/settings" className="btn-primary text-sm">
        Conectar en Configuración
      </Link>
    </div>
  )
}
