import type { ObservationRevisionEntry } from '../../types/observation'
import { Clock, Edit3, Search, Flag } from 'lucide-react'

type RevisionTimelineProps = {
  entries: ObservationRevisionEntry[]
}

const TRIGGER_ICON: Record<ObservationRevisionEntry['trigger'], React.ReactNode> = {
  manual: <Edit3 size={12} className="text-blue-400" />,
  similar_found: <Search size={12} className="text-purple-400" />,
  recheck_flag: <Flag size={12} className="text-amber-400" />,
}

export function RevisionTimeline({ entries }: RevisionTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="text-slate-500 text-sm text-center py-4">
        No revisions yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
              {TRIGGER_ICON[entry.trigger]}
            </div>
            <div className="w-px flex-1 bg-slate-700 mt-1" />
          </div>
          <div className="pb-3 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-400 text-xs capitalize">{entry.trigger.replace(/_/g, ' ')}</span>
              <span className="text-slate-600 text-xs flex items-center gap-1">
                <Clock size={10} />
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-slate-300 text-sm">{entry.note}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
