import { useEffect, useState } from 'react'
import { AlertTriangle, Check, X } from 'lucide-react'

interface FactionOption {
  name: string
  slug: string
}

interface ParsedRow {
  name: string
  points: number | number[]
}

interface ResultRow {
  name: string
  applied: boolean
  oldPoints?: Array<number | null> | null
  newPoints?: number[]
  error?: string
}

const PLACEHOLDER = `{
  "Captain": 90,
  "Assault Intercessor Squad": [85, 170]
}`

function formatPoints(value: number | number[] | Array<number | null> | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return Array.isArray(value) ? value.join(', ') : String(value)
}

export function PointsPanel() {
  const [factions, setFactions] = useState<FactionOption[]>([])
  const [slug, setSlug] = useState('')
  const [raw, setRaw] = useState('')
  const [rows, setRows] = useState<ParsedRow[] | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [results, setResults] = useState<ResultRow[] | null>(null)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    fetch('/api/admin/factions')
      .then((res) => res.json())
      .then((data: FactionOption[]) => setFactions(data))
      .catch(() => setFactions([]))
  }, [])

  const parse = () => {
    setResults(null)
    try {
      const value: unknown = JSON.parse(raw)
      const parsed: ParsedRow[] = Array.isArray(value)
        ? (value as ParsedRow[])
        : Object.entries(value as Record<string, number | number[]>).map(([name, points]) => ({
            name,
            points,
          }))
      setRows(parsed)
      setParseError(null)
    } catch (error) {
      setRows(null)
      setParseError(error instanceof Error ? error.message : 'JSON inválido')
    }
  }

  const updateRow = (index: number, value: string) => {
    setRows((prev) => {
      if (!prev) return prev
      const next = [...prev]
      const points = value.includes(',')
        ? value.split(',').map((v) => Number(v.trim()))
        : Number(value)
      next[index] = { ...next[index], points }
      return next
    })
  }

  const apply = () => {
    if (!rows || !slug) return
    setApplying(true)
    fetch('/api/admin/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factionSlug: slug, updates: rows }),
    })
      .then((res) => res.json())
      .then((data: { results: ResultRow[] }) => setResults(data.results))
      .finally(() => setApplying(false))
  }

  return (
    <div className="points-panel">
      <label className="field-label" htmlFor="points-faction">Facción</label>
      <select id="points-faction" value={slug} onChange={(e) => setSlug(e.target.value)}>
        <option value="">Selecciona una facción</option>
        {factions.map((faction) => (
          <option key={faction.slug} value={faction.slug}>{faction.name}</option>
        ))}
      </select>

      <label className="field-label" htmlFor="points-json">JSON de puntos nuevos</label>
      <textarea
        id="points-json"
        rows={8}
        placeholder={PLACEHOLDER}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />
      <button type="button" disabled={!raw || !slug} onClick={parse}>Previsualizar</button>

      {parseError && (
        <p className="admin-alert">
          <AlertTriangle size={14} /> {parseError}
        </p>
      )}

      {rows && (
        <>
          <table className="points-preview">
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Puntos nuevos</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const result = results?.find((r) => r.name === row.name)
                return (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>
                      <input
                        value={Array.isArray(row.points) ? row.points.join(', ') : String(row.points)}
                        onChange={(e) => updateRow(index, e.target.value)}
                      />
                    </td>
                    <td>
                      {result ? (
                        result.applied ? (
                          <span className="result-ok">
                            <Check size={14} /> {formatPoints(result.oldPoints)} → {formatPoints(result.newPoints)}
                          </span>
                        ) : (
                          <span className="result-error">
                            <X size={14} /> {result.error}
                          </span>
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <button type="button" disabled={applying || !slug} onClick={apply}>
            {applying ? 'Aplicando…' : 'Aplicar cambios'}
          </button>
        </>
      )}
    </div>
  )
}
