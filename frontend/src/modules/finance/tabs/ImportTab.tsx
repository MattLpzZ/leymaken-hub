import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react'
import { TransactionsService } from '@/lib/services/transactions.service'

interface ParsedRow {
  description: string
  amount: string
  date: string
  type: 'income' | 'expense'
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const rawAmount = cols[1] ?? '0'
    const numAmount = parseFloat(rawAmount.replace(/[^0-9.-]/g, '')) || 0
    return {
      description: cols[0] ?? '—',
      amount: Math.abs(numAmount).toString(),
      date: cols[2] ?? new Date().toISOString().slice(0, 10),
      type: (numAmount >= 0 ? 'income' : 'expense') as 'income' | 'expense',
    }
  }).filter(r => r.description !== '—')
}

export default function ImportTab() {
  const [dragging, setDragging]   = useState(false)
  const [fileName, setFileName]   = useState<string | null>(null)
  const [rows, setRows]           = useState<ParsedRow[]>([])
  const [error, setError]         = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [imported, setImported]   = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    setError(null)
    setImported(null)
    if (!file.name.endsWith('.csv')) {
      setError('Solo se aceptan archivos CSV.')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        setError('No se encontraron filas válidas. Asegúrate de que el CSV tenga encabezado y datos.')
        setFileName(null)
      } else {
        setRows(parsed)
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleImport = async () => {
    if (rows.length === 0) return
    setImporting(true)
    try {
      await Promise.all(rows.map(r =>
        TransactionsService.create({
          description: r.description,
          amount: parseFloat(r.amount),
          date: r.date,
          type: r.type,
          category: 'Otro',
          account: 'Otro',
        })
      ))
      setImported(rows.length)
      setRows([])
      setFileName(null)
    } catch {
      setError('Error al importar. Intenta de nuevo.')
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setFileName(null)
    setRows([])
    setError(null)
    setImported(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {imported !== null && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-400 font-medium">
            {imported} transacciones importadas correctamente.
          </p>
          <button onClick={reset} className="ml-auto p-1 text-gray-500 hover:text-gray-300">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!fileName && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
            dragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-gray-700 hover:border-gray-600'
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
              <Upload size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                Arrastra tu archivo CSV aquí
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                CSV exportado de Banreservas, BHD, Popular — columnas: Descripción, Monto, Fecha
              </p>
            </div>
            <label className="btn-secondary text-xs cursor-pointer" onClick={e => e.stopPropagation()}>
              <FileSpreadsheet size={13} /> Seleccionar archivo
              <input ref={inputRef} type="file" className="hidden" accept=".csv" onChange={handleInput} />
            </label>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle size={15} />
            <span>{fileName} — <span className="font-semibold">{rows.length} transacciones detectadas</span></span>
          </div>

          <div className="card p-0 overflow-hidden">
            <p className="text-xs font-medium px-4 py-2.5 border-b border-gray-800" style={{ color: 'var(--text-2)' }}>
              Preview (primeras 5 filas)
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {['Descripción', 'Monto', 'Fecha', 'Tipo'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell" style={{ color: 'var(--text-1)' }}>{row.description}</td>
                    <td className={`table-cell font-mono font-semibold ${row.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {row.type === 'income' ? '+' : '-'}RD$ {Number(row.amount).toLocaleString()}
                    </td>
                    <td className="table-cell" style={{ color: 'var(--text-3)' }}>{row.date}</td>
                    <td className="table-cell">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${row.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {row.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary" onClick={reset}>Cancelar</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleImport} disabled={importing}>
              {importing && <Loader2 size={13} className="animate-spin" />}
              {importing ? 'Importando...' : `Importar ${rows.length} transacciones`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
