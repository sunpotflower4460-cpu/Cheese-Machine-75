import { Compass, MessagesSquare } from 'lucide-react'
import type { AppMode } from '../../types/experience'

type ModeSwitchProps = {
  mode: AppMode
  onChange: (mode: AppMode) => void
}

const OPTIONS: Array<{ key: AppMode; label: string; icon: typeof Compass }> = [
  { key: 'observe', label: '観察研究モード', icon: Compass },
  { key: 'experience', label: '体験モード', icon: MessagesSquare },
]

export const ModeSwitch = ({ mode, onChange }: ModeSwitchProps) => (
  <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1 shadow-sm">
    {OPTIONS.map(({ key, label, icon: Icon }) => {
      const isActive = mode === key

      return (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </button>
      )
    })}
  </div>
)
