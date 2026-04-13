import { ArrowRight, GitPullRequest, Link as LinkIcon } from 'lucide-react'
import { NODE_DICT, RELATION_DICT } from '../../core/nodeData'
import type { NodePipelineResult } from '../../types/nodeStudio'
import { Badge, ExplanationDetails, OriginBadge, TabHeader } from '../components/CommonUI'

type RelationsTabProps = {
  pipelineResult: NodePipelineResult
}

export const RelationsTab = ({ pipelineResult }: RelationsTabProps) => (
  <div className="flex flex-col">
    <TabHeader title="Relations" description="Node同士がどう結ばれて意味の骨組みになったかを見る場所" icon={LinkIcon} colorClass="border-emerald-100 text-emerald-900" />
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center rounded-t-2xl">
        <h3 className="font-bold text-slate-700 flex items-center gap-2"><GitPullRequest className="w-4 h-4 text-emerald-500" /> Bindings & Meanings</h3>
        <Badge colorClass="bg-emerald-100 text-emerald-700">{pipelineResult.bindings.length}</Badge>
      </div>
      <div className="p-4 flex flex-col gap-5">
        {pipelineResult.bindings.length === 0 ? <div className="text-sm text-slate-400 text-center py-8">結合は見つかりませんでした</div> : null}
        {pipelineResult.bindings.map((binding, index) => (
          <div key={binding.id} className={`rounded-xl border bg-white ${index === 0 ? 'border-emerald-200 shadow-sm p-5 ring-1 ring-emerald-50' : 'border-slate-100 p-4'}`}>
            {index === 0 ? <div className="mb-4"><Badge colorClass="bg-emerald-500 text-white">Main Relation</Badge></div> : null}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col flex-1">
                  <span className="font-mono text-xs text-slate-400 text-center mb-1">{NODE_DICT[binding.source]?.ja || binding.source}</span>
                  <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-lg truncate text-center">{binding.source}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 mt-4" />
                <div className="flex flex-col flex-1">
                  <span className="font-mono text-xs text-slate-400 text-center mb-1">{NODE_DICT[binding.target]?.ja || binding.target}</span>
                  <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-lg truncate text-center">{binding.target}</span>
                </div>
              </div>
              <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex flex-col gap-2 relative">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">{binding.type}</span>
                  <span className="text-sm font-bold text-emerald-900">{RELATION_DICT[binding.type]?.ja || binding.type}</span>
                </div>
                <p className="text-[13px] text-emerald-800 leading-relaxed font-medium bg-white p-2.5 rounded-lg border border-emerald-50 shadow-sm">{RELATION_DICT[binding.type]?.desc || 'ノード間の構造的な結びつき'}</p>
              </div>
              <ExplanationDetails title="この結合の由来と理由">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-500 font-bold">結合の重み: {binding.weight.toFixed(2)}</span>
                  <OriginBadge origin="構造の要約" />
                </div>
                <div className="text-[11px] text-slate-600 font-medium">推論理由: {binding.reasons[0]}</div>
              </ExplanationDetails>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)
