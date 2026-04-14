import type { ObservationCrystal } from '../../types/observation'
import { ConfidenceBadge } from './ConfidenceBadge'
import { AlertTriangle, Tag, Upload } from 'lucide-react'

type EventCardProps = {
  crystal: ObservationCrystal
  onClick?: () => void
}

export function EventCard({ crystal, onClick }: EventCardProps) {
  const sv = crystal.pipelineResult.stateVector
  const topNode = crystal.pipelineResult.activatedNodes[0]
  const topPattern = crystal.pipelineResult.liftedPatterns[0]
  const date = new Date(crystal.createdAt).toLocaleString()
  const isUploaded = crystal.sourceType === 'uploaded-image'

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-500 rounded-lg p-4 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-medium text-sm truncate">
              {topNode ? topNode.label.replace(/_/g, ' ') : 'Unknown event'}
            </span>
            {crystal.recheckFlag && (
              <AlertTriangle size={13} className="text-amber-400 shrink-0" />
            )}
            {isUploaded && (
              <span className="flex items-center gap-0.5 bg-blue-900/40 text-blue-300 border border-blue-700/40 text-[10px] px-1.5 py-0.5 rounded shrink-0">
                <Upload size={9} />
                uploaded
              </span>
            )}
          </div>
          {topPattern && (
            <p className="text-slate-400 text-xs mb-2">{topPattern.label}</p>
          )}
          <div className="flex flex-wrap gap-1 mb-2">
            {crystal.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-0.5 bg-slate-700 text-slate-300 text-xs px-1.5 py-0.5 rounded">
                <Tag size={9} />
                {tag}
              </span>
            ))}
          </div>
          <p className="text-slate-500 text-xs">{date}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <ConfidenceBadge value={sv.confidence} label="conf" />
          <ConfidenceBadge value={1 - sv.artifactRisk} label="signal" />
        </div>
      </div>
    </button>
  )
}
