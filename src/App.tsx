import { useState, useCallback } from 'react'
import { HomePage } from './ui/pages/HomePage'
import { LiveObservePage } from './ui/pages/LiveObservePage'
import { EventDetailPage } from './ui/pages/EventDetailPage'
import { ArchivePage } from './ui/pages/ArchivePage'
import { StudioPage } from './ui/pages/StudioPage'
import { LabPage } from './ui/pages/LabPage'
import { loadCrystals, addCrystal } from './storage/crystalStorage'
import type { ObservationCrystal } from './types/observation'

export type Route = '/' | '/observe' | '/archive' | '/studio' | '/lab' | `/event/${string}`

export default function App() {
  const [route, setRoute] = useState<Route>('/')
  const [crystals, setCrystals] = useState<ObservationCrystal[]>(() => loadCrystals())
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const navigate = useCallback((to: Route) => setRoute(to), [])

  const handleSaveCrystal = useCallback((crystal: ObservationCrystal) => {
    const updated = addCrystal(crystal)
    setCrystals(updated)
  }, [])

  const navigateToEvent = useCallback((id: string) => {
    setSelectedEventId(id)
    setRoute(`/event/${id}`)
  }, [])

  if (route === '/') return <HomePage crystals={crystals} navigate={navigate} navigateToEvent={navigateToEvent} />
  if (route === '/observe') return <LiveObservePage crystals={crystals} onSave={handleSaveCrystal} navigate={navigate} />
  if (route === '/archive') return <ArchivePage crystals={crystals} navigate={navigate} navigateToEvent={navigateToEvent} />
  if (route === '/studio') {
    const crystal = selectedEventId ? crystals.find((c) => c.id === selectedEventId) ?? crystals[0] : crystals[0]
    return <StudioPage crystal={crystal ?? null} crystals={crystals} navigate={navigate} navigateToEvent={navigateToEvent} />
  }
  if (route === '/lab') return <LabPage crystals={crystals} navigate={navigate} />
  if (route.startsWith('/event/')) {
    const id = selectedEventId ?? route.replace('/event/', '')
    const crystal = crystals.find((c) => c.id === id) ?? null
    return <EventDetailPage crystal={crystal} crystals={crystals} navigate={navigate} navigateToEvent={navigateToEvent} />
  }
  return <HomePage crystals={crystals} navigate={navigate} navigateToEvent={navigateToEvent} />
}
