import type { GuideBundle } from '../../types/observation'
import { AlertTriangle, ArrowRight, BookOpen, Zap } from 'lucide-react'

type GuidePanelProps = {
  guide: GuideBundle
  compact?: boolean
}

export function GuidePanel({ guide, compact = false }: GuidePanelProps) {
  return (
    <div className="space-y-3">
      {/* Quick guide */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={14} className="text-yellow-400" />
          <span className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Quick Guide</span>
        </div>
        <p className="text-white text-sm leading-relaxed">{guide.quickGuide}</p>
      </div>

      {/* Deep guide */}
      {!compact && (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-blue-400" />
            <span className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Deep Analysis</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{guide.deepGuide}</p>
        </div>
      )}

      {/* Bridge guide */}
      {!compact && (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight size={14} className="text-purple-400" />
            <span className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Next Steps</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{guide.bridgeGuide}</p>
        </div>
      )}

      {/* Caution notes */}
      <div className="bg-slate-800 border border-amber-800/40 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={14} className="text-amber-400" />
          <span className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Cautions</span>
        </div>
        <ul className="space-y-1">
          {guide.cautionNotes.map((note, i) => (
            <li key={i} className="text-amber-200/80 text-xs leading-relaxed">• {note}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
