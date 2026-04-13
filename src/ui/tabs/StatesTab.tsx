import { MinusCircle, ShieldAlert, Zap } from 'lucide-react'
import { CATEGORY_JA, NODE_DICT } from '../../core/nodeData'
import type { NodePipelineResult } from '../../types/nodeStudio'
import { Badge, ExplanationDetails, OriginBadge, ProgressBar, TabHeader } from '../components/CommonUI'

type StatesTabProps = {
  pipelineResult: NodePipelineResult
}

export const StatesTab = ({ pipelineResult }: StatesTabProps) => (
  <div className="flex flex-col">
    <TabHeader title="States" description="何が前に出て、何が押さえられているかを見る場所" icon={Zap} colorClass="border-blue-100 text-blue-900" />
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center rounded-t-2xl">
          <h3 className="font-bold text-slate-700 flex items-center gap-2"><Zap className="w-4 h-4 text-blue-500" /> Activated Nodes</h3>
          <Badge colorClass="bg-blue-100 text-blue-700">{pipelineResult.activatedNodes.length}</Badge>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {pipelineResult.activatedNodes.map((node, index) => (
            <div key={node.id} className={`rounded-xl border bg-white transition-all ${index === 0 ? 'border-blue-200 shadow-sm p-5 ring-1 ring-blue-50' : 'border-slate-100 p-4'}`}>
              {index === 0 ? <div className="mb-3"><Badge colorClass="bg-blue-500 text-white">Main State</Badge></div> : null}
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className={`font-mono font-bold text-blue-900 ${index === 0 ? 'text-lg' : 'text-[15px]'}`}>{node.label}</span>
                  <span className="text-sm font-bold text-slate-500">{NODE_DICT[node.label]?.ja || node.label}</span>
                </div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">{node.value.toFixed(2)}</span>
              </div>
              <p className="text-[13px] text-slate-600 font-medium mb-3 bg-slate-50 px-3 py-2 rounded-lg">{NODE_DICT[node.label]?.desc || '抽出された要素です'}</p>
              <ProgressBar value={node.value} colorClass="bg-blue-500" />
              <ExplanationDetails title="この要素の由来とカテゴリ">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">{CATEGORY_JA[node.category] || node.category}</span>
                  <OriginBadge origin="自然反応" />
                </div>
                <div className="mt-1 text-xs text-slate-500 font-medium">抽出理由: {node.reasons[0]}</div>
              </ExplanationDetails>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center rounded-t-2xl">
          <h3 className="font-bold text-slate-700 flex items-center gap-2"><MinusCircle className="w-4 h-4 text-slate-400" /> Suppressed Nodes</h3>
          <Badge colorClass="bg-slate-100 text-slate-500">{pipelineResult.suppressedNodes.length}</Badge>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {pipelineResult.suppressedNodes.length === 0 ? <div className="text-sm text-slate-400 py-4 text-center">抑制されたノードはありません</div> : null}
          {pipelineResult.suppressedNodes.map((node) => (
            <div key={node.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className="font-mono text-[15px] font-bold text-slate-500 line-through decoration-slate-300">{node.label}</span>
                  <span className="text-xs font-bold text-slate-400">{NODE_DICT[node.label]?.ja || node.label}</span>
                </div>
                <span className="text-xs font-mono text-slate-400">{node.value.toFixed(2)}</span>
              </div>
              <div className="mt-2 text-[13px] text-slate-500 font-medium flex items-start gap-1.5 bg-white p-2.5 rounded-lg border border-slate-100"><ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> {node.reason}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)
