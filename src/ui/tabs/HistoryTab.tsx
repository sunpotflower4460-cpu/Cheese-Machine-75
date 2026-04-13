import { Clock } from 'lucide-react'
import type { HistoryItem } from '../../types/nodeStudio'
import { TabHeader } from '../components/CommonUI'

type HistoryTabProps = {
  history: HistoryItem[]
  restoreHistory: (item: HistoryItem) => void
}

export const HistoryTab = ({ history, restoreHistory }: HistoryTabProps) => (
  <div className="flex flex-col">
    <TabHeader title="History" description="これまでの解析結果を見返す場所" icon={Clock} colorClass="border-slate-200 text-slate-800" />
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
      <div className="p-0 flex flex-col divide-y divide-slate-100">
        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm font-medium">履歴はありません</div>
        ) : (
          history.map((item) => {
            const mainState = item.pipelineResult.activatedNodes[0]
            const mainPattern = item.pipelineResult.liftedPatterns[0]
            return (
              <div key={item.id} onClick={() => restoreHistory(item)} className="p-5 hover:bg-slate-50 cursor-pointer transition-colors flex flex-col gap-3">
                <div className="flex justify-between items-start gap-4">
                  <p className="text-[15px] font-semibold text-slate-800 line-clamp-2 leading-relaxed flex-1">"{item.text}"</p>
                  <span className="text-xs font-mono font-bold text-slate-400 shrink-0 mt-1">{item.time}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {mainState ? <span className="text-[10px] px-2 py-1 uppercase tracking-wider bg-blue-50 text-blue-600 rounded-md border border-blue-100 font-bold">{mainState.label}</span> : null}
                  {mainPattern ? <span className="text-[10px] px-2 py-1 uppercase tracking-wider bg-purple-50 text-purple-600 rounded-md border border-purple-100 font-bold">{mainPattern.label}</span> : null}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  </div>
)
