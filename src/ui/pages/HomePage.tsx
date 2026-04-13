import type { Route } from '../../App'
import type { ObservationCrystal } from '../../types/observation'
import { NavBar } from '../components/NavBar'
import { EventCard } from '../components/EventCard'
import { Microscope, Eye, AlertTriangle, Atom } from 'lucide-react'

type HomePageProps = {
  crystals: ObservationCrystal[]
  navigate: (to: Route) => void
  navigateToEvent: (id: string) => void
}

export function HomePage({ crystals, navigate, navigateToEvent }: HomePageProps) {
  const recent = crystals.slice(0, 3)
  const recheckCount = crystals.filter((c) => c.recheckFlag).length

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavBar navigate={navigate} current="/" />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-600 flex items-center justify-center">
              <Microscope size={32} className="text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Cheese Machine 75</h1>
          <p className="text-slate-400 text-base max-w-md mx-auto">
            Observation, interpretation, and recording app for particle detection events. Built on Node-AI-Z.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{crystals.length}</p>
            <p className="text-slate-400 text-xs mt-0.5">Crystals saved</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{recheckCount}</p>
            <p className="text-slate-400 text-xs mt-0.5">Need recheck</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-400">
              {crystals.filter((c) => c.tags.includes('particle-candidate')).length}
            </p>
            <p className="text-slate-400 text-xs mt-0.5">Candidates</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => navigate('/observe')}
            className="flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <Eye size={18} />
            Start Observing
          </button>
          <button
            onClick={() => navigate('/studio')}
            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <Atom size={18} />
            Open Studio
          </button>
        </div>

        {/* Recheck alert */}
        {recheckCount > 0 && (
          <button
            onClick={() => navigate('/archive')}
            className="w-full flex items-center gap-3 bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 mb-6 hover:bg-amber-900/50 transition-colors text-left"
          >
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <span className="text-amber-200 text-sm">
              {recheckCount} event{recheckCount !== 1 ? 's' : ''} flagged for recheck – review in Archive.
            </span>
          </button>
        )}

        {/* Recent events */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-wide">Recent Events</h2>
              <button onClick={() => navigate('/archive')} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {recent.map((c) => (
                <EventCard key={c.id} crystal={c} onClick={() => navigateToEvent(c.id)} />
              ))}
            </div>
          </div>
        )}

        {crystals.length === 0 && (
          <div className="text-center py-8 border border-dashed border-slate-700 rounded-lg">
            <p className="text-slate-500 text-sm">No events saved yet.</p>
            <p className="text-slate-600 text-xs mt-1">Start observing to capture your first crystal.</p>
          </div>
        )}
      </div>
    </div>
  )
}
