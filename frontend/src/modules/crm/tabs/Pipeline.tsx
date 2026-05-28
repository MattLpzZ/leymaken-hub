import { useState, useEffect } from 'react'
import { Plus, Loader2, X } from 'lucide-react'
import { CrmDealsService, type CrmDeal } from '@/lib/services/crm.service'

type Stage = 'lead' | 'contactado' | 'reunion' | 'propuesta' | 'negociacion' | 'cerrado'

const STAGES: { id: Stage; label: string; color: string; bg: string }[] = [
  { id: 'lead',        label: 'Lead',         color: 'text-gray-400',   bg: 'bg-gray-500/10'   },
  { id: 'contactado',  label: 'Contactado',   color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  { id: 'reunion',     label: 'Reunión',      color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'propuesta',   label: 'Propuesta',    color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
  { id: 'negociacion', label: 'Negociación',  color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { id: 'cerrado',     label: 'Cerrado ✓',   color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
]

const BLANK = { client_name: '', service: '', amount: '', stage: 'lead' as Stage, notes: '' }

export default function Pipeline() {
  const [deals, setDeals]       = useState<CrmDeal[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(BLANK)

  useEffect(() => {
    CrmDealsService.list()
      .then(data => setDeals(data))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const created = await CrmDealsService.create({
      client_name: form.client_name,
      service: form.service,
      amount: parseFloat(form.amount as any),
      stage: form.stage,
      notes: form.notes,
      probability: 10,
    })
    setDeals(prev => [...prev, created])
    setForm(BLANK)
    setShowForm(false)
  }

  const advanceDeal = async (id: number) => {
    const idx = STAGES.findIndex(s => s.id === deals.find(d => d.id === id)?.stage)
    const nextStage = STAGES[Math.min(STAGES.length - 1, idx + 1)].id
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage: nextStage } : d))
    try {
      await CrmDealsService.advance(id)
    } catch {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, stage: STAGES[idx].id } : d))
    }
  }

  const retreatDeal = async (id: number) => {
    const idx = STAGES.findIndex(s => s.id === deals.find(d => d.id === id)?.stage)
    const prevStage = STAGES[Math.max(0, idx - 1)].id
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage: prevStage } : d))
    try {
      await CrmDealsService.retreat(id)
    } catch {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, stage: STAGES[idx].id } : d))
    }
  }

  const remove = async (id: number) => {
    setDeals(prev => prev.filter(d => d.id !== id))
    try {
      await CrmDealsService.remove(id)
    } catch {
      CrmDealsService.list().then(data => setDeals(data))
    }
  }

  const active   = deals.filter(d => d.stage !== 'cerrado')
  const pipeline = active.reduce((a, d) => a + d.amount * d.probability / 100, 0)
  const closed   = deals.filter(d => d.stage === 'cerrado').reduce((a, d) => a + d.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      <div className="grid grid-cols-3 gap-4">
        <div className="card py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Deals activos</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{active.length}</p>
        </div>
        <div className="card py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Pipeline ponderado</p>
          <p className="text-2xl font-bold text-amber-400">RD$ {Math.round(pipeline).toLocaleString()}</p>
        </div>
        <div className="card py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Cerrado</p>
          <p className="text-2xl font-bold text-emerald-400">RD$ {closed.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          {deals.length} oportunidades
        </p>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs py-1.5">
          <Plus size={13} /> Nueva oportunidad
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Nueva oportunidad</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Cliente / Empresa</label>
                  <input required className="input" placeholder="Nombre..." value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Servicio de interés</label>
                  <input required className="input" placeholder="Sitio web, SaaS..." value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Valor estimado (RD$)</label>
                  <input required type="number" className="input" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Etapa inicial</label>
                  <select className="input" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as Stage }))}>
                    {STAGES.filter(s => s.id !== 'cerrado').map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notas</label>
                <input className="input" placeholder="Contexto del lead..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Agregar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deals.length === 0 && !showForm && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Sin oportunidades en el pipeline</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Crea tu primera oportunidad con el botón de arriba</p>
        </div>
      )}

      {deals.length > 0 && (
        <div className="overflow-x-auto pb-2">
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(180px, 1fr))`, minWidth: '1100px' }}>
            {STAGES.map(stage => {
              const stageDeals = deals.filter(d => d.stage === stage.id)
              const stageTotal = stageDeals.reduce((a, d) => a + d.amount, 0)
              return (
                <div key={stage.id}>
                  <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl ${stage.bg} border border-b-0 border-gray-800`}>
                    <span className={`text-xs font-semibold ${stage.color}`}>{stage.label}</span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-3)' }}>{stageDeals.length}</span>
                  </div>
                  <div className="space-y-2 p-2 rounded-b-xl border border-gray-800 bg-gray-900/40 min-h-[120px]">
                    {stageDeals.map(d => (
                      <div key={d.id} className="card-sm space-y-2 cursor-default">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{d.client_name}</p>
                            <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-3)' }}>{d.service}</p>
                          </div>
                          <button onClick={() => remove(d.id)} className="text-gray-700 hover:text-red-400 flex-shrink-0 transition-colors">×</button>
                        </div>
                        <p className="text-xs font-mono font-bold text-emerald-400">RD$ {d.amount.toLocaleString()}</p>
                        {d.notes && (
                          <p className="text-[10px] leading-4 line-clamp-2" style={{ color: 'var(--text-3)' }}>{d.notes}</p>
                        )}
                        <div className="flex items-center gap-1 pt-1">
                          {stage.id !== 'lead' && (
                            <button onClick={() => retreatDeal(d.id)}
                              className="flex-1 text-[10px] py-0.5 rounded border border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors text-center">
                              ← Atrás
                            </button>
                          )}
                          {stage.id !== 'cerrado' && (
                            <button onClick={() => advanceDeal(d.id)}
                              className="flex-1 text-[10px] py-0.5 rounded border border-gray-700 text-gray-500 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors text-center">
                              Avanzar →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {stageDeals.length === 0 && (
                      <p className="text-[10px] text-center py-4" style={{ color: 'var(--text-3)' }}>Sin oportunidades</p>
                    )}
                  </div>
                  {stageTotal > 0 && (
                    <p className="text-[10px] font-mono text-center mt-1 text-emerald-400">
                      RD$ {stageTotal.toLocaleString()}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
