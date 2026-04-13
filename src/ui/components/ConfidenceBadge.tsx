type ConfidenceBadgeProps = {
  value: number   // 0–1
  label?: string
  size?: 'sm' | 'md'
}

export function ConfidenceBadge({ value, label, size = 'sm' }: ConfidenceBadgeProps) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 70 ? 'bg-green-900 text-green-300 border-green-700' :
    pct >= 45 ? 'bg-amber-900 text-amber-300 border-amber-700' :
    'bg-red-900 text-red-300 border-red-700'

  const text = size === 'md' ? 'text-sm' : 'text-xs'

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${color} ${text} font-mono`}>
      {label && <span className="opacity-70">{label}</span>}
      <span>{pct}%</span>
    </span>
  )
}
