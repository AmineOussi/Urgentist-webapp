'use client'

// ──────────────────────────────────────────────────────────────
//  /statistiques — Tableau de bord analytique
// ──────────────────────────────────────────────────────────────
import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Users, Activity, Clock, CheckCircle2, TrendingUp,
  RefreshCw, BarChart3, PieChart, ArrowUp, ArrowDown,
  Minus, AlertTriangle,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
interface StatsData {
  kpis: {
    totalPatients:    number
    visitesToday:     number
    visitesEnAttente: number
    visitesEnCours:   number
    visitesTerminees: number
  }
  dailyVisits:   { date: string; count: number }[]
  triageData:    { triage: string; count: number }[]
  orientData:    { orientation: string; count: number }[]
  monthlyTrend:  { date: string; count: number }[]
}

// ── Animated counter hook ──────────────────────────────────────
function useAnimatedValue(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const frame = useRef<number | null>(null)
  const start = useRef<number | null>(null)

  useEffect(() => {
    if (frame.current) cancelAnimationFrame(frame.current)
    start.current = null

    const from = 0
    const diff  = target - from

    function tick(ts: number) {
      if (!start.current) start.current = ts
      const elapsed = ts - start.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + diff * eased))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => { if (frame.current) cancelAnimationFrame(frame.current) }
  }, [target, duration])

  return value
}

// ── Triage config ──────────────────────────────────────────────
const TRIAGE_CONFIG: Record<string, { label: string; color: string; bg: string; bar: string }> = {
  P1: { label: 'P1 — Urgence absolue',   color: 'text-red-600',    bg: 'bg-red-100',    bar: 'bg-red-500' },
  P2: { label: 'P2 — Urgence relative',  color: 'text-orange-600', bg: 'bg-orange-100', bar: 'bg-orange-400' },
  P3: { label: 'P3 — Semi-urgent',       color: 'text-yellow-600', bg: 'bg-yellow-100', bar: 'bg-yellow-400' },
  P4: { label: 'P4 — Non-urgent',        color: 'text-green-600',  bg: 'bg-green-100',  bar: 'bg-green-500' },
}

const ORIENTATION_LABELS: Record<string, string> = {
  SORTIE_DOMICILE:  'Retour domicile',
  HOSPITALISATION:  'Hospitalisation',
  TRANSFERT_SAMU:   'Transfert SAMU',
  OBSERVATION_UHCD: 'Observation UHCD',
  DECES:            'Décès',
}

const ORIENTATION_COLORS: Record<string, string> = {
  SORTIE_DOMICILE:  'bg-emerald-500',
  HOSPITALISATION:  'bg-blue-500',
  TRANSFERT_SAMU:   'bg-violet-500',
  OBSERVATION_UHCD: 'bg-amber-500',
  DECES:            'bg-gray-500',
}

// ── KPI Card ───────────────────────────────────────────────────
function KpiCard({
  label, value, icon, color, sub, trend,
}: {
  label: string
  value: number
  icon:  React.ReactNode
  color: string
  sub?:  string
  trend?: 'up' | 'down' | 'neutral'
}) {
  const animated = useAnimatedValue(value)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 flex items-start gap-4 hover:shadow-card-lg transition-shadow duration-300">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', color)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-black text-gray-900 leading-none tabular-nums">{animated.toLocaleString('fr-FR')}</p>
          {trend && trend !== 'neutral' && (
            <span className={cn('flex items-center gap-0.5 text-xs font-bold mb-0.5', trend === 'up' ? 'text-emerald-500' : 'text-red-500')}>
              {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            </span>
          )}
        </div>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ── Mini bar chart (7 days) ────────────────────────────────────
function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)

  const dayLabels = ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'H', 'Auj']

  return (
    <div className="flex items-end gap-1.5 h-20 w-full">
      {data.map((d, i) => {
        const pct = Math.round((d.count / max) * 100)
        const isToday = i === data.length - 1
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group relative">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
              <div className="bg-gray-900 text-white text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                {d.count} visite{d.count !== 1 ? 's' : ''}
              </div>
              <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-0.5" />
            </div>
            {/* Bar */}
            <div className="w-full flex-1 flex flex-col justify-end">
              <div
                className={cn(
                  'w-full rounded-t-lg transition-all duration-700 delay-75',
                  isToday ? 'bg-brand-500' : 'bg-brand-200 group-hover:bg-brand-400',
                )}
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
            </div>
            {/* Label */}
            <span className={cn('text-[9px] font-bold', isToday ? 'text-brand-600' : 'text-gray-400')}>
              {dayLabels[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Horizontal progress bar chart ─────────────────────────────
function HorizBar({
  label, count, total, color, subLabel,
}: {
  label: string; count: number; total: number; color: string; subLabel?: string
}) {
  const pct    = total > 0 ? Math.round((count / total) * 100) : 0
  const [w, setW] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setW(pct), 100)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className="text-xs font-bold text-gray-900 tabular-nums">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
          style={{ width: `${w}%` }}
        />
      </div>
      {subLabel && <p className="text-[10px] text-gray-400">{subLabel}</p>}
    </div>
  )
}

// ── Monthly trend mini sparkline (pure CSS) ────────────────────
function SparkLine({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.count), 1)
  const W   = 300
  const H   = 60
  const pad = 4

  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (W - 2 * pad)
    const y = H - pad - ((d.count / max) * (H - 2 * pad))
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const areaPoints = [
    `${pad},${H - pad}`,
    ...data.map((d, i) => {
      const x = pad + (i / Math.max(data.length - 1, 1)) * (W - 2 * pad)
      const y = H - pad - ((d.count / max) * (H - 2 * pad))
      return `${x.toFixed(1)},${y.toFixed(1)}`
    }),
    `${W - pad},${H - pad}`,
  ].join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3366FF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3366FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#sparkGrad)" />
      <polyline
        points={points}
        fill="none"
        stroke="#3366FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Section wrapper ────────────────────────────────────────────
function Section({ title, icon, children, className }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden', className)}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
        {icon && (
          <div className="w-7 h-7 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            {icon}
          </div>
        )}
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Skeleton for loading state ─────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24">
            <div className="flex gap-3">
              <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-2/3" />
                <div className="h-7 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-40">
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-2.5 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function StatistiquesPage() {
  const [data,     setData]     = useState<StatsData | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('Erreur serveur')
      const json = await res.json()
      setData(json)
      setLastFetch(new Date())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [load])

  const totalTriage    = data ? data.triageData.reduce((a, b) => a + b.count, 0) : 0
  const totalOrient    = data ? data.orientData.reduce((a, b) => a + b.count, 0) : 0
  const todayVisits    = data?.kpis.visitesToday ?? 0
  const yesterdayAvg  = data
    ? Math.round(
        data.dailyVisits.slice(0, -1).reduce((a, d) => a + d.count, 0) /
        Math.max(data.dailyVisits.slice(0, -1).length, 1)
      )
    : 0
  const trend: 'up' | 'down' | 'neutral' = todayVisits > yesterdayAvg ? 'up' : todayVisits < yesterdayAvg ? 'down' : 'neutral'

  return (
    <div className="flex flex-col gap-6 animate-fade-in px-5 md:px-8 py-6 pb-24 md:pb-8 max-w-7xl w-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Statistiques</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {lastFetch
              ? `Actualisé à ${lastFetch.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
              : 'Chargement…'}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all shadow-sm',
            loading && 'opacity-50 cursor-not-allowed',
          )}
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Actualiser
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && !data ? (
        <StatsSkeleton />
      ) : data ? (
        <>
          {/* ── KPI Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <KpiCard
              label="Patients total"
              value={data.kpis.totalPatients}
              icon={<Users className="w-5 h-5 text-blue-600" />}
              color="bg-blue-50"
              sub="Inscrits dans le système"
            />
            <KpiCard
              label="Visites aujourd'hui"
              value={data.kpis.visitesToday}
              icon={<Activity className="w-5 h-5 text-brand-600" />}
              color="bg-brand-50"
              sub={`Moy. 7j : ${yesterdayAvg} / jour`}
              trend={trend}
            />
            <KpiCard
              label="En attente"
              value={data.kpis.visitesEnAttente}
              icon={<Clock className="w-5 h-5 text-amber-600" />}
              color="bg-amber-50"
              sub="Triage effectué, pas encore vu"
            />
            <KpiCard
              label="Clôturées (total)"
              value={data.kpis.visitesTerminees}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              color="bg-emerald-50"
              sub="Toutes périodes confondues"
            />
          </div>

          {/* ── Charts row 1 ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Visites 7 derniers jours */}
            <Section
              title="Visites — 7 derniers jours"
              icon={<BarChart3 className="w-4 h-4" />}
            >
              {data.dailyVisits.length > 0 ? (
                <MiniBarChart data={data.dailyVisits} />
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">Aucune donnée disponible</p>
              )}
            </Section>

            {/* Tendance 30 jours */}
            <Section
              title="Tendance — 30 derniers jours"
              icon={<TrendingUp className="w-4 h-4" />}
            >
              {data.monthlyTrend.length > 0 ? (
                <>
                  <SparkLine data={data.monthlyTrend} />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">Il y a 30 jours</span>
                    <span className="text-xs font-semibold text-gray-600">
                      {data.monthlyTrend.reduce((a, d) => a + d.count, 0)} visites
                    </span>
                    <span className="text-xs text-gray-400">Aujourd'hui</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">Aucune donnée disponible</p>
              )}
            </Section>
          </div>

          {/* ── Charts row 2 ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Triage distribution */}
            <Section
              title="Répartition par triage (30j)"
              icon={<PieChart className="w-4 h-4" />}
            >
              {totalTriage > 0 ? (
                <div className="space-y-3">
                  {data.triageData
                    .sort((a, b) => a.triage.localeCompare(b.triage))
                    .map(({ triage, count }) => {
                      const cfg = TRIAGE_CONFIG[triage] ?? { label: triage, bar: 'bg-gray-400' }
                      return (
                        <HorizBar
                          key={triage}
                          label={cfg.label}
                          count={count}
                          total={totalTriage}
                          color={cfg.bar}
                        />
                      )
                    })}
                  <p className="text-xs text-gray-400 pt-1">{totalTriage} visites au total</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">Aucune donnée disponible</p>
              )}
            </Section>

            {/* Orientation breakdown */}
            <Section
              title="Orientations à la clôture (30j)"
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {totalOrient > 0 ? (
                <div className="space-y-3">
                  {data.orientData
                    .sort((a, b) => b.count - a.count)
                    .map(({ orientation, count }) => (
                      <HorizBar
                        key={orientation}
                        label={ORIENTATION_LABELS[orientation] ?? orientation}
                        count={count}
                        total={totalOrient}
                        color={ORIENTATION_COLORS[orientation] ?? 'bg-gray-400'}
                      />
                    ))}
                  <p className="text-xs text-gray-400 pt-1">{totalOrient} clôtures au total</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">Aucune donnée disponible</p>
              )}
            </Section>
          </div>

          {/* ── Live status strip ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
              <div className="w-7 h-7 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">État en temps réel</h2>
            </div>
            <div className="p-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'En attente',   value: data.kpis.visitesEnAttente, color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400' },
                { label: 'En cours',     value: data.kpis.visitesEnCours,   color: 'bg-blue-100  text-blue-700',    dot: 'bg-blue-400 animate-pulse' },
                { label: 'Clôturés auj.',value: data.kpis.visitesToday,     color: 'bg-gray-100  text-gray-700',    dot: 'bg-gray-400' },
              ].map(item => (
                <div key={item.label} className={cn('rounded-xl p-3 flex flex-col items-center gap-2', item.color)}>
                  <div className={cn('w-2.5 h-2.5 rounded-full', item.dot)} />
                  <p className="text-2xl font-black tabular-nums">{item.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-center">{item.label}</p>
                </div>
              ))}
            </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
