import type { Route } from '../../App'
import { Atom, Archive, FlaskConical, Eye, Home, Microscope } from 'lucide-react'

type NavBarProps = {
  navigate: (to: Route) => void
  current: Route
}

const NAV_ITEMS: Array<{ label: string; route: Route; Icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { label: 'Home', route: '/', Icon: Home },
  { label: 'Observe', route: '/observe', Icon: Eye },
  { label: 'Archive', route: '/archive', Icon: Archive },
  { label: 'Studio', route: '/studio', Icon: Atom },
  { label: 'Lab', route: '/lab', Icon: FlaskConical },
]

export function NavBar({ navigate, current }: NavBarProps) {
  return (
    <nav className="bg-slate-900 border-b border-slate-700 px-4 py-2 flex items-center gap-1">
      <div className="flex items-center gap-2 mr-6">
        <Microscope size={18} className="text-green-400" />
        <span className="text-white font-semibold text-sm tracking-wide">Cheese Machine 75</span>
      </div>
      {NAV_ITEMS.map(({ label, route, Icon }) => {
        const active = current === route || (route !== '/' && current.startsWith(route))
        return (
          <button
            key={route}
            onClick={() => navigate(route)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
              active
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
