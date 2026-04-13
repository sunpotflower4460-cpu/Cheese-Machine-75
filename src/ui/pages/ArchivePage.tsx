import { useState } from 'react'
import type { Route } from '../../App'
import type { ObservationCrystal } from '../../types/observation'
import { NavBar } from '../components/NavBar'
import { EventCard } from '../components/EventCard'
import { Archive, SortAsc, SortDesc, AlertTriangle } from 'lucide-react'

type ArchivePageProps = {
  crystals: ObservationCrystal[]
  navigate: (to: Route) => void
  navigateToEvent: (id: string) => void
}

type SortKey = 'date' | 'confidence' | 'recheck'

export function ArchivePage({ crystals, navigate, navigateToEvent }: ArchivePageProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filterRecheck, setFilterRecheck] = useState(false)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...crystals]
    .filter((c) => !filterRecheck || c.recheckFlag)
    .sort((a, b) => {
      let diff = 0
      if (sortKey === 'date') diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortKey === 'confidence') diff = a.pipelineResult.stateVector.confidence - b.pipelineResult.stateVector.confidence
      if (sortKey === 'recheck') diff = Number(a.recheckFlag) - Number(b.recheckFlag)
      return sortDir === 'asc' ? diff : -diff
    })

  const SortIcon = sortDir === 'asc' ? SortAsc : SortDesc

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavBar navigate={navigate} current="/archive" />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Archive size={18} className="text-slate-400" />
          <h1 className="text-lg font-bold text-white">Archive</h1>
          <span className="text-slate-500 text-sm ml-auto">{crystals.length} crystals</span>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-slate-500 text-xs">Sort:</span>
          {(['date', 'confidence', 'recheck'] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors ${
                sortKey === key
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {key}
              {sortKey === key && <SortIcon size={11} />}
            </button>
          ))}
          <button
            onClick={() => setFilterRecheck((v) => !v)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors ml-2 ${
              filterRecheck
                ? 'bg-amber-800 text-amber-200'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle size={11} />
            Recheck only
          </button>
        </div>

        {/* List */}
        {sorted.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-700 rounded-lg">
            <p className="text-slate-500 text-sm">
              {filterRecheck ? 'No events flagged for recheck.' : 'No crystals saved yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((c) => (
              <EventCard key={c.id} crystal={c} onClick={() => navigateToEvent(c.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
