import { cn } from '@/lib/utils'

type Color = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple' | 'teal'

const colors: Record<Color, string> = {
  gray:   'bg-gray-100   text-gray-600   border-gray-200',
  blue:   'bg-blue-50    text-blue-700   border-blue-200',
  green:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  yellow: 'bg-amber-50   text-amber-700  border-amber-200',
  red:    'bg-red-50     text-red-700    border-red-200',
  orange: 'bg-orange-50  text-orange-700 border-orange-200',
  purple: 'bg-violet-50  text-violet-700 border-violet-200',
  teal:   'bg-teal-50    text-teal-700   border-teal-200',
}

interface BadgeProps {
  color?: Color
  dot?: boolean
  pulse?: boolean
  className?: string
  children: React.ReactNode
}

export function Badge({ color = 'gray', dot, pulse, className, children }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border',
      colors[color],
      className,
    )}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', {
          'bg-gray-400':   color === 'gray',
          'bg-blue-500':   color === 'blue',
          'bg-emerald-500':color === 'green',
          'bg-amber-500':  color === 'yellow',
          'bg-red-500':    color === 'red',
          'bg-orange-500': color === 'orange',
          'bg-violet-500': color === 'purple',
          'bg-teal-500':   color === 'teal',
          'animate-pulse': pulse,
        })} />
      )}
      {children}
    </span>
  )
}

// Triage-specific badge
const TRIAGE_CONFIG = {
  P1: { label: 'P1 · Immédiat',    cls: 'bg-red-600    text-white     border-transparent', pulse: true  },
  P2: { label: 'P2 · Urgent',      cls: 'bg-orange-500 text-white     border-transparent', pulse: false },
  P3: { label: 'P3 · Semi-urgent', cls: 'bg-amber-400  text-amber-900 border-transparent', pulse: false },
  P4: { label: 'P4 · Non urgent',  cls: 'bg-emerald-500 text-white    border-transparent', pulse: false },
}

export function TriageBadge({ triage }: { triage: keyof typeof TRIAGE_CONFIG }) {
  const cfg = TRIAGE_CONFIG[triage] ?? TRIAGE_CONFIG.P3
  return (
    <span className={cn(
      'inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full border',
      cfg.cls,
      cfg.pulse && 'animate-pulse-p1',
    )}>
      {cfg.label}
    </span>
  )
}

// Statut visite badge
const STATUT_CONFIG = {
  EN_ATTENTE: { label: 'En attente', color: 'orange' as Color, dot: true  },
  EN_COURS:   { label: 'En cours',   color: 'green'  as Color, dot: true  },
  TERMINE:    { label: 'Terminé',    color: 'gray'   as Color, dot: false },
  TRANSFERE:  { label: 'Transféré',  color: 'purple' as Color, dot: false },
}

export function StatutBadge({ statut }: { statut: keyof typeof STATUT_CONFIG }) {
  const cfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG.EN_ATTENTE
  return <Badge color={cfg.color} dot={cfg.dot} pulse={cfg.dot && statut === 'EN_ATTENTE'}>{cfg.label}</Badge>
}
