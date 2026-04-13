import { Clock } from 'lucide-react'
import type { ObservationRecord } from '../../types/experience'
import { TabHeader } from '../components/CommonUI'

type HistoryTabProps = {
  history: ObservationRecord[]
  restoreHistory: (item: ObservationRecord) => void
}

export const HistoryTab = ({ history, restoreHistory }: HistoryTabProps) => (
  <div className="flex flex-col">
    <TabHeader title="History" description="観察研究モードの解析履歴と、体験モードから戻ってきた会話ログを見返す場所" icon={Clock} colorClass="border-slate-200 text-slate-800" />
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col divide-y divide-slate-100 p-0">
        {history.length === 0 ? (
          <div className="p-8 text-center text-sm font-medium text-slate-400">履歴はありません</div>
        ) : (
          history.map((item) => {
            const mainState = item.pipelineResult.activatedNodes[0]
            const mainPattern = item.pipelineResult.liftedPatterns[0]
            const modeLabel = item.type === 'observe' ? '観察研究モード' : '体験モード'
            const modeClass = item.type === 'observe' ? 'border-indigo-100 bg-indigo-50 text-indigo-600' : 'border-rose-100 bg-rose-50 text-rose-600'

            return (
              <div key={item.id} onClick={() => restoreHistory(item)} className="flex cursor-pointer flex-col gap-3 p-5 transition-colors hover:bg-slate-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-md border px-2 py-1 text-[10px] font-bold tracking-wider ${modeClass}`}>{modeLabel}</span>
                      <span className="text-[11px] font-semibold text-slate-400">{item.time}</span>
                    </div>
                    <p className="line-clamp-2 text-[15px] font-semibold leading-relaxed text-slate-800">"{item.text}"</p>
                    {item.type === 'experience' ? <p title={item.assistantReply} className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-slate-500">返答: {item.assistantReply}</p> : null}
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {mainState ? <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">{mainState.label}</span> : null}
                  {mainPattern ? <span className="rounded-md border border-purple-100 bg-purple-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600">{mainPattern.label}</span> : null}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  </div>
)
