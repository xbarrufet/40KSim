import { FactionsView } from './FactionsView'
import { UnitsView } from './UnitsView'

interface HomeViewProps {
  selectedFaction: { slug: string; name: string } | null
  onSelectFaction: (faction: { slug: string; name: string }) => void
  onBack: () => void
}

export function HomeView({ selectedFaction, onSelectFaction, onBack }: HomeViewProps) {
  if (selectedFaction) {
    return <UnitsView faction={selectedFaction} onBack={onBack} />
  }
  return <FactionsView onSelectFaction={onSelectFaction} />
}
