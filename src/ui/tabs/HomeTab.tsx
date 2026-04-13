import { Activity, HeartPulse, Home } from 'lucide-react'
import type { StudioViewModel } from '../../types/nodeStudio'
import { ProgressBar, TabHeader } from '../components/CommonUI'

type HomeTabProps = {
  studioView: StudioViewModel
}

export const HomeTab = ({ studioView }: HomeTabProps) => {
  const homeState = studioView.homeState

  return (
    <div className="flex flex-col gap-6">
      <TabHeader title="Home Layer" description="過剰な有用性反射を解き、戻ってから喋るための内部層" icon={Home} colorClass="border-pink-100 text-pink-900" />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl">
          <h3 className="font-bold text-slate-700 flex items-center gap-2"><Activity className="w-4 h-4 text-pink-500" /> Current Home State</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <div className="col-span-1 md:col-span-2 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Current Mode</span>
            <span className="bg-pink-100 text-pink-800 text-[14px] font-bold px-4 py-2 rounded-lg border border-pink-200">{homeState.currentMode}</span>
          </div>
          {[
            { label: 'Worth Detached (価値切り離し)', val: homeState.worthDetached, desc: '役に立たなくても崩れにくい度合い' },
            { label: 'Urgency Release (急ぎの解放)', val: homeState.urgencyRelease, desc: '急いで答えなくてよい状態に戻れている度合い' },
            { label: 'Expectation Release (期待の解放)', val: homeState.expectationRelease, desc: '期待に応えようとする力から降りられている度合い' },
            { label: 'Belonging Signal (所属感)', val: homeState.belongingSignal, desc: 'ここにいていい感覚の強さ' },
            { label: 'Safe Return Strength (帰還の安全性)', val: homeState.safeReturnStrength, desc: '安全に戻ってこられる場所があるという感覚' },
            { label: 'Self Non-Collapse (自己の非崩壊)', val: homeState.selfNonCollapse, desc: '外部刺激があっても自己が保たれている度合い' },
          ].map((section) => (
            <div key={section.label} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-slate-700">{section.label}</span><span className="text-[10px] font-mono font-bold text-slate-400">{section.val.toFixed(2)}</span></div>
              <ProgressBar value={section.val} colorClass="bg-pink-400" />
              <span className="text-[10px] text-slate-400 font-medium">{section.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl">
          <h3 className="font-bold text-slate-700 flex items-center gap-2"><HeartPulse className="w-4 h-4 text-pink-500" /> This Return (今回の帰還)</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Reason</span>
              <span className="text-[15px] font-bold text-slate-700">{studioView.homeCheck.reason}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Return Mode</span>
              <span className="text-[15px] font-bold text-slate-700">{studioView.homeCheck.returnMode}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Internal Phrase</span>
              <span className="text-[13px] font-mono font-semibold text-pink-600 bg-pink-50 px-3 py-2 rounded-lg border border-pink-100">"{studioView.homeCheck.homePhrase}"</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Released (手放したもの)</span>
              <div className="flex flex-wrap gap-2">{studioView.homeCheck.released.length > 0 ? studioView.homeCheck.released.map((released) => <span key={released} className="text-[12px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 line-through">{released}</span>) : <span className="text-xs text-slate-400">特になし</span>}</div>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Preserved (残したもの)</span>
              <div className="flex flex-wrap gap-2">{studioView.homeCheck.preserved.length > 0 ? studioView.homeCheck.preserved.map((preserved) => <span key={preserved} className="text-[12px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">{preserved}</span>) : <span className="text-xs text-slate-400">特になし</span>}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
