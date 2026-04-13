import { Layers } from 'lucide-react'
import type { StudioViewModel } from '../../types/nodeStudio'
import { Badge, ExplanationDetails, OriginBadge, TabHeader } from '../components/CommonUI'

type PatternsTabProps = {
  studioView: StudioViewModel
}

export const PatternsTab = ({ studioView }: PatternsTabProps) => (
  <div className="flex flex-col">
    <TabHeader title="Patterns" description="結合の束からどんな中位構造が浮上したかを見る場所" icon={Layers} colorClass="border-purple-100 text-purple-900" />
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center rounded-t-2xl">
        <h3 className="font-bold text-slate-700 flex items-center gap-2"><Layers className="w-4 h-4 text-purple-500" /> Lifted Patterns</h3>
        <Badge colorClass="bg-purple-100 text-purple-700">{studioView.enrichedPatterns.length}</Badge>
      </div>
      <div className="p-4 flex flex-col gap-4">
        {studioView.enrichedPatterns.length === 0 ? <div className="text-sm text-slate-400 text-center py-8">浮上したパターンはありません</div> : null}
        {studioView.enrichedPatterns.map((pattern, index) => (
          <div key={pattern.id} className={`rounded-xl border bg-white ${index === 0 ? 'border-purple-200 shadow-sm p-5 ring-1 ring-purple-50' : 'border-slate-100 p-4'}`}>
            <div className="mb-3">{index === 0 ? <Badge colorClass="bg-purple-500 text-white">Main Pattern</Badge> : <Badge colorClass="bg-slate-200 text-slate-600">Possible Pattern</Badge>}</div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-sm font-bold text-slate-400">{pattern.label}</span>
                <span className={`font-bold text-purple-900 ${index === 0 ? 'text-xl' : 'text-lg'}`}>{pattern.titleJa}</span>
              </div>
              <span className="text-sm font-mono font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-md">{pattern.score.toFixed(2)}</span>
            </div>
            <div className="text-[13px] font-medium text-slate-700 mb-2 bg-purple-50/50 p-3 rounded-lg border border-purple-100/50 leading-relaxed">{pattern.simpleDescJa}</div>
            <ExplanationDetails title="このパターンの構成要素">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-bold text-slate-500">内部定義: {pattern.internalDescription}</span>
                <OriginBadge origin="構造の要約" />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Matched Nodes:</span>
                {pattern.matchedNodes.map((matchedNode, index2) => (
                  <span key={index2} className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">{matchedNode}</span>
                ))}
              </div>
            </ExplanationDetails>
          </div>
        ))}
      </div>
    </div>
  </div>
)
