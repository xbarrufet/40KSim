import { ArrowLeft } from 'lucide-react'
import type { StructuredAbilitiesData } from '../data/schema'

export function TopBar({ name, onBack, tag }: { name: string; onBack: () => void; tag?: StructuredAbilitiesData['tag'] }) {
  return (
    <div className="unit-board-topbar">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={14} /> Unidades
      </button>
      <h1>{name}</h1>
      {tag && <span className={`status-light is-${tag === 'CONFIRMED' ? 'green' : 'red'}`} aria-hidden="true" />}
    </div>
  )
}
