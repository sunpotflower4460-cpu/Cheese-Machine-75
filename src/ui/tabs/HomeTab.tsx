import { Activity, ShieldAlert, Home } from 'lucide-react'
import type { StudioViewModel } from '../../types/nodeStudio'
import { ProgressBar, TabHeader } from '../components/CommonUI'

type HomeTabProps = {
  studioView: StudioViewModel
}

export const HomeTab = ({ studioView }: HomeTabProps) => {
  const homeState = studioView.homeState

  return (
    <div className="flex flex-col gap-6">
      <TabHeader title="Home / Caution Layer" description="Observation caution layer: prevents exciting findings from being over-claimed before returning to the guide" icon={Home} colorClass="border-pink-100 text-pink-900" />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl">
          <h3 className="font-bold text-slate-700 flex items-center gap-2"><Activity className="w-4 h-4 text-pink-500" /> Observation Caution State</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <div className="col-span-1 md:col-span-2 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Current Mode</span>
            <span className="bg-pink-100 text-pink-800 text-[14px] font-bold px-4 py-2 rounded-lg border border-pink-200">{homeState.currentMode}</span>
          </div>
          {[
            { label: 'Worth Detached', val: homeState.worthDetached, desc: 'Claim value does not collapse when rarity drops' },
            { label: 'Urgency Release', val: homeState.urgencyRelease, desc: 'Not rushing to produce an interpretation' },
            { label: 'Expectation Release', val: homeState.expectationRelease, desc: 'Not over-fitting to expected results' },
            { label: 'Belonging Signal', val: homeState.belongingSignal, desc: 'Event fits within expected observation context' },
            { label: 'Safe Return Strength', val: homeState.safeReturnStrength, desc: 'Can return to baseline without losing the signal' },
            { label: 'Self Non-Collapse', val: homeState.selfNonCollapse, desc: 'Interpretation stable under noise pressure' },
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
          <h3 className="font-bold text-slate-700 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-pink-500" /> Caution Check Result</h3>
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
              <span className="text-[10px] font-bold text-slate-400 uppercase">Caution Phrase</span>
              <span className="text-[13px] font-mono font-semibold text-pink-600 bg-pink-50 px-3 py-2 rounded-lg border border-pink-100">"{studioView.homeCheck.homePhrase}"</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Suppressed (over-claim risk reduced)</span>
              <div className="flex flex-wrap gap-2">{studioView.homeCheck.released.length > 0 ? studioView.homeCheck.released.map((released) => <span key={released} className="text-[12px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 line-through">{released}</span>) : <span className="text-xs text-slate-400">None</span>}</div>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Preserved (kept in interpretation)</span>
              <div className="flex flex-wrap gap-2">{studioView.homeCheck.preserved.map((preserved) => <span key={preserved} className="text-[12px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">{preserved}</span>)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
