import { useState } from 'react'
import type { ReactNode } from 'react'
import { Brain, ChevronDown, ChevronUp, Info, Sparkles, Workflow } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const OriginBadge = ({ origin }: { origin: string }) => {
  const getStyle = () => {
    switch (origin) {
      case '自然反応':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case '姿勢選択':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case '安全寄り補正':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case '急がない判断':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Guide観測':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case '構造の要約':
        return 'bg-slate-100 text-slate-700 border-slate-200'
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }

  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-sm flex items-center shrink-0 ${getStyle()}`}>{origin}</span>
}

export const VoiceLabel = ({ type }: { type: 'ai' | 'guide' | 'process' }) => {
  if (type === 'ai') {
    return (
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-purple-200 shadow-sm"><Brain className="w-4 h-4" /> Crystallized AI says</span>
        <span className="text-[11px] font-bold text-slate-400">結晶AIの返答</span>
      </div>
    )
  }

  if (type === 'guide') {
    return (
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-indigo-200 shadow-sm"><Sparkles className="w-4 h-4" /> Guide AI observes</span>
        <span className="text-[11px] font-bold text-slate-400">Guide AI の観測</span>
      </div>
    )
  }

  if (type === 'process') {
    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-slate-200 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-slate-300 shadow-sm"><Workflow className="w-4 h-4" /> Internal Process</span>
        <span className="text-[11px] font-bold text-slate-400">この返答に至る心の流れ</span>
      </div>
    )
  }

  return null
}

export const ExplanationDetails = ({ title = '背景の意味を見る', children }: { title?: string; children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mt-3 bg-slate-50/50 rounded-lg border border-slate-200/60 overflow-hidden">
      <button onClick={(event) => { event.stopPropagation(); setIsOpen(!isOpen) }} className="w-full px-3 py-2.5 flex items-center justify-between text-[11px] font-bold text-slate-500 hover:bg-slate-100/50 hover:text-slate-700 transition-colors focus:outline-none">
        <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> {title}</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {isOpen ? <div className="px-4 pb-4 pt-2 border-t border-slate-100/80 flex flex-col gap-2">{children}</div> : null}
    </div>
  )
}

export const Badge = ({ children, colorClass, className = '' }: { children: ReactNode; colorClass: string; className?: string }) => {
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider inline-flex items-center gap-1 ${colorClass} ${className}`}>{children}</span>
}

export const ProgressBar = ({ value, colorClass }: { value: number; colorClass: string }) => {
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${colorClass}`} style={{ width: `${value * 100}%` }} />
    </div>
  )
}

export const TabHeader = ({ title, description, icon: Icon, colorClass }: { title: string; description: string; icon: LucideIcon; colorClass: string }) => (
  <div className={`flex flex-col gap-1.5 p-4 md:p-5 rounded-2xl border mb-6 shadow-sm bg-white ${colorClass}`}>
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm ring-1 ring-black/5"><Icon className="w-5 h-5" /></div>
      <h2 className="font-bold text-lg text-slate-800 tracking-tight">{title}</h2>
    </div>
    <p className="text-[13px] font-medium text-slate-500 opacity-90 pl-[34px] leading-relaxed">{description}</p>
  </div>
)
