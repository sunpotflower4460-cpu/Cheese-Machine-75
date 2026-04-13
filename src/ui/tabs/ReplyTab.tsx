import type { Dispatch, SetStateAction } from 'react'
import { Activity, ChevronDown, ChevronUp, Globe, HeartPulse, Home, MessageSquareText, Search, Timer } from 'lucide-react'
import type { StudioViewModel } from '../../types/nodeStudio'
import { Badge, OriginBadge, TabHeader, VoiceLabel } from '../components/CommonUI'

type ReplyTabProps = {
  studioView: StudioViewModel
  analyzedText: string
  isProcessOpen: boolean
  setIsProcessOpen: Dispatch<SetStateAction<boolean>>
}

export const ReplyTab = ({ studioView, analyzedText, isProcessOpen, setIsProcessOpen }: ReplyTabProps) => {
  return (
    <div className="flex flex-col gap-6">
      <TabHeader title="Reply" description="この入力に現状どう返すか / どういうプロセスでそうなったか" icon={MessageSquareText} colorClass="border-purple-100 text-purple-900" />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /> Input Full Text</h3>
        <p className="text-slate-800 font-medium text-[16px] md:text-[18px] leading-relaxed">"{analyzedText}"</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> 心の流れの要約</h3>
        <p className="text-[15px] text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{studioView.flowSummaryText}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-purple-200 p-5 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative z-10">
          <VoiceLabel type="ai" />

          {studioView.homeCheck.needsReturn ? (
            <div className="flex flex-col gap-3 mt-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl relative">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Before Return (直感的な過剰整理)</span>
                <p className="text-slate-500 line-through text-[14px] leading-relaxed">{studioView.rawReplyPreview}</p>
              </div>
              <div className="flex items-center justify-center -my-3 z-10 relative">
                <span className="bg-pink-100 text-pink-800 text-[10px] font-bold px-3 py-1.5 rounded-full border border-pink-200 shadow-sm flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5" /> Home Layer: {studioView.homeCheck.homePhrase}
                </span>
              </div>
              <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl shadow-sm">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest block mb-2">After Return (戻ってから話した言葉)</span>
                <p className="text-purple-900 font-semibold text-[16px] leading-relaxed border-l-4 border-purple-300 pl-4">{studioView.adjustedReplyPreview}</p>
              </div>
            </div>
          ) : (
            <p className="text-slate-800 font-semibold text-[16px] leading-loose border-l-4 border-purple-300 pl-4 py-1 mt-3">{studioView.adjustedReplyPreview}</p>
          )}
        </div>
      </div>

      {studioView.homeCheck.needsReturn ? (
        <div className="bg-pink-50/50 rounded-2xl shadow-sm border border-pink-100 p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-pink-600 mb-4 flex items-center gap-1.5"><Home className="w-3.5 h-3.5" /> Home Return (返答前の調整)</h3>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Return Reason</span>
              <span className="text-sm font-bold text-slate-800">{studioView.homeCheck.reason} ({studioView.homeCheck.returnMode})</span>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Released (手放したもの)</span>
              <div className="flex flex-wrap gap-1.5">
                {studioView.homeCheck.released.map((released, index) => <Badge key={index} colorClass="bg-white text-slate-500 border border-slate-200 line-through">{released}</Badge>)}
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Preserved (残したもの)</span>
              <div className="flex flex-wrap gap-1.5">
                {studioView.homeCheck.preserved.map((preserved, index) => <Badge key={index} colorClass="bg-pink-100 text-pink-700 border border-pink-200">{preserved}</Badge>)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Response Meta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">Reply Temperature</span>
            <span className="text-sm font-semibold text-slate-800">{studioView.responseMeta.temperature}</span>
          </div>
          <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">Estimated Time</span>
            <span className="text-sm font-semibold text-slate-800 flex items-center gap-1"><Timer className="w-4 h-4 text-slate-400" /> {studioView.responseMeta.time}</span>
          </div>
          <div className="flex flex-col gap-2 p-4 bg-red-50/50 rounded-xl border border-red-100 md:col-span-2">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-red-500 uppercase">What was withheld (あえてしなかったこと)</span>
              <OriginBadge origin={studioView.homeCheck.needsReturn ? '急がない判断' : '安全寄り補正'} />
            </div>
            <span className="text-sm font-semibold text-red-900">{studioView.responseMeta.withheld}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
        <div className="flex justify-between items-center mb-2">
          <VoiceLabel type="process" />
          <button onClick={() => setIsProcessOpen(!isProcessOpen)} className="md:hidden p-2 text-slate-400">{isProcessOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</button>
        </div>
        {isProcessOpen ? (
          <div className="relative border-l-2 border-slate-200 ml-3.5 flex flex-col gap-7 mt-5">
            {studioView.internalProcess.map((item, index) => (
              <div key={index} className="relative pl-7">
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-[3px] border-white shadow-sm ${item.label === 'Home Check' || item.label === 'Return' ? 'bg-pink-400' : 'bg-slate-400'}`}></div>
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${item.label === 'Home Check' || item.label === 'Return' ? 'bg-pink-100 text-pink-800' : 'bg-slate-100 text-slate-800'}`}>{item.label}</span>
                  <span className="text-[11px] font-medium text-slate-500">{item.desc}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className={`text-[15px] font-bold ${index === studioView.internalProcess.length - 1 ? 'text-purple-700' : 'text-slate-800'}`}>{item.content}</div>
                  <OriginBadge origin={item.origin} />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="bg-indigo-50/50 rounded-2xl shadow-sm border border-indigo-100 p-5 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/30 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <VoiceLabel type="guide" />
            <OriginBadge origin="Guide観測" />
          </div>
          <div className="flex flex-col gap-4 mt-2">
            <div className="bg-white rounded-xl p-4 border border-indigo-100/50 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">Summary</h4>
              <p className="text-[14px] text-slate-700 font-medium leading-relaxed">{studioView.guideObserves.summary}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-indigo-100/50 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">Naturalness Advice (自然さへの助言)</h4>
              <p className="text-[14px] text-slate-700 font-bold leading-relaxed">{studioView.guideObserves.naturalnessAdvice}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
