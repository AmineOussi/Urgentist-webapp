'use client'

import { useState, useRef, useEffect } from 'react'
import type { Constante } from '../types'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { Plus, Activity, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'

// ── Normal ranges ─────────────────────────────────────────────
function vitStatus(key: string, val: number | null): 'normal' | 'warn' | 'alert' | 'unknown' {
  if (val === null) return 'unknown'
  switch (key) {
    case 'taSystolique':  return val < 90 || val > 180 ? 'alert' : val > 140 ? 'warn' : 'normal'
    case 'taDiastolique': return val < 60 || val > 110 ? 'alert' : val > 90  ? 'warn' : 'normal'
    case 'fc':            return val < 40 || val > 150  ? 'alert' : val > 100 || val < 60 ? 'warn' : 'normal'
    case 'spo2':          return val < 90 ? 'alert' : val < 95 ? 'warn' : 'normal'
    case 'temperature':   return val > 40 || val < 35   ? 'alert' : val > 38.5 ? 'warn' : 'normal'
    case 'eva':           return val >= 8 ? 'alert' : val >= 5 ? 'warn' : 'normal'
    case 'glycemie':      return val > 3   || val < 0.6  ? 'alert' : val > 2 ? 'warn' : 'normal'
    default: return 'normal'
  }
}

const STATUS_STYLES = {
  normal:  { card: 'bg-emerald-50 border-emerald-100', label: 'text-emerald-600', val: 'text-emerald-700' },
  warn:    { card: 'bg-amber-50  border-amber-100',   label: 'text-amber-600',   val: 'text-amber-700'  },
  alert:   { card: 'bg-red-50   border-red-100',      label: 'text-red-600',     val: 'text-red-700'    },
  unknown: { card: 'bg-gray-50  border-gray-100',     label: 'text-gray-400',    val: 'text-gray-400'   },
}

// ── Vitals config ─────────────────────────────────────────────
const VITALS = [
  { key: 'taSystolique',  label: 'Tension',    unit: 'mmHg', icon: '🩺', displayFn: (c: Constante) => c.taSystolique ? `${c.taSystolique}/${c.taDiastolique}` : null },
  { key: 'fc',            label: 'Pouls',      unit: 'bpm',  icon: '💓', displayFn: (c: Constante) => c.fc?.toString() ?? null },
  { key: 'spo2',          label: 'SpO₂',       unit: '%',    icon: '🫁', displayFn: (c: Constante) => c.spo2?.toString() ?? null },
  { key: 'temperature',   label: 'Température', unit: '°C',  icon: '🌡️', displayFn: (c: Constante) => c.temperature?.toString() ?? null },
  { key: 'eva',           label: 'Douleur EVA', unit: '/10', icon: '😣', displayFn: (c: Constante) => c.eva !== null ? `${c.eva}/10` : null },
  { key: 'glycemie',      label: 'Glycémie',   unit: 'g/L',  icon: '🍬', displayFn: (c: Constante) => c.glycemie?.toString() ?? null },
]

// ── Mini sparkline ────────────────────────────────────────────
function Sparkline({ values }: { values: (number | null)[] }) {
  const nums = values.filter((v): v is number => v !== null)
  if (nums.length < 2) return null
  const min = Math.min(...nums), max = Math.max(...nums), range = max - min || 1
  const W = 60, H = 24
  const points = nums.map((v, i) => `${(i / (nums.length - 1)) * W},${H - ((v - min) / range) * H}`).join(' ')
  return (
    <svg width={W} height={H} className="opacity-60">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} />
    </svg>
  )
}

// ── Modal ajout constantes ────────────────────────────────────
function AjouterConstantesModal({ visiteId, open, onClose, onMutate }: {
  visiteId: string; open: boolean; onClose: () => void; onMutate: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    taSystolique: '', taDiastolique: '', fc: '', spo2: '',
    temperature: '', glycemie: '', eva: '', poids: '', fr: '',
  })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function submit() {
    setLoading(true)
    const payload: Record<string, number | null> = {}
    Object.entries(form).forEach(([k, v]) => { payload[k] = v.trim() ? parseFloat(v) : null })
    const res = await fetch('/api/constantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visiteId, ...payload }),
    })
    setLoading(false)
    if (res.ok) {
      toast('success', 'Constantes enregistrées')
      onClose()
      onMutate()
    } else {
      toast('error', 'Erreur lors de l\'enregistrement')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouveau relevé de constantes"
      description="Saisir les valeurs mesurées — laisser vide si non mesuré."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} loading={loading}>Enregistrer</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Cardio-vasculaire</label>
          <div className="grid grid-cols-3 gap-3">
            <Input label="TA Systolique" type="number" placeholder="120" value={form.taSystolique} onChange={set('taSystolique')} hint="mmHg" />
            <Input label="TA Diastolique" type="number" placeholder="80" value={form.taDiastolique} onChange={set('taDiastolique')} hint="mmHg" />
            <Input label="Pouls (FC)" type="number" placeholder="72" value={form.fc} onChange={set('fc')} hint="bpm" />
          </div>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Respiratoire & Métabolique</label>
          <div className="grid grid-cols-3 gap-3">
            <Input label="SpO₂" type="number" placeholder="98" value={form.spo2} onChange={set('spo2')} hint="%" />
            <Input label="Fréq. respiratoire" type="number" placeholder="16" value={form.fr} onChange={set('fr')} hint="/min" />
            <Input label="Température" type="number" placeholder="37.0" value={form.temperature} onChange={set('temperature')} hint="°C" step="0.1" />
          </div>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Autres</label>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Glycémie" type="number" placeholder="1.0" value={form.glycemie} onChange={set('glycemie')} hint="g/L" step="0.1" />
            <Input label="Douleur EVA" type="number" placeholder="0" min="0" max="10" value={form.eva} onChange={set('eva')} hint="/10" />
            <Input label="Poids" type="number" placeholder="70" value={form.poids} onChange={set('poids')} hint="kg" />
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── Main tab ──────────────────────────────────────────────────
export default function ConstantesTab({ constantes, visiteId, onMutate }: {
  constantes: Constante[]; visiteId: string; onMutate: () => void
}) {
  const [addOpen, setAddOpen] = useState(false)
  const last = constantes[constantes.length - 1] ?? null
  const hasData = constantes.length > 0

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Constantes vitales</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {hasData ? `${constantes.length} relevé${constantes.length > 1 ? 's' : ''} · dernier à ${new Date(last!.releveAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Aucun relevé'}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} icon={<Plus className="w-4 h-4" />} size="sm">
          Nouveau relevé
        </Button>
      </div>

      {/* KPI cards */}
      {last ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {VITALS.map(v => {
            const rawKey = v.key as keyof Constante
            const rawVal = last[rawKey] as number | null
            const display = v.displayFn(last)
            const status = vitStatus(v.key, rawKey === 'taSystolique' ? last.taSystolique : rawVal)
            const styles = STATUS_STYLES[display ? status : 'unknown']
            const trend = constantes.length >= 2
              ? (() => {
                  const prev = (constantes[constantes.length - 2] as any)[v.key]
                  if (rawVal === null || prev === null) return null
                  return rawVal > prev ? 'up' : rawVal < prev ? 'down' : 'stable'
                })()
              : null

            return (
              <div key={v.key} className={cn('rounded-2xl border p-4 transition-all', styles.card)}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-xs font-semibold', styles.label)}>{v.icon} {v.label}</span>
                  <div className="flex items-center gap-1.5">
                    {status === 'alert' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                    {trend === 'up'     && <TrendingUp   className="w-3.5 h-3.5 opacity-60" />}
                    {trend === 'down'   && <TrendingDown  className="w-3.5 h-3.5 opacity-60" />}
                    {trend === 'stable' && <Minus         className="w-3.5 h-3.5 opacity-40" />}
                  </div>
                </div>
                <p className={cn('text-2xl font-bold font-mono leading-none', styles.val)}>
                  {display ?? '—'}
                </p>
                <div className="flex items-end justify-between mt-2">
                  <span className={cn('text-[11px]', styles.label)}>{v.unit}</span>
                  <Sparkline values={constantes.map(c => (c as any)[v.key])} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 border-dashed flex flex-col items-center justify-center py-12 gap-3">
          <Activity className="w-10 h-10 text-gray-300" />
          <p className="text-sm text-gray-400">Aucune constante enregistrée</p>
          <Button onClick={() => setAddOpen(true)} variant="secondary" icon={<Plus className="w-4 h-4" />} size="sm">
            Saisir les constantes
          </Button>
        </div>
      )}

      {/* History table */}
      {constantes.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Historique</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
                  <th className="px-4 py-2.5 text-left font-semibold">Heure</th>
                  <th className="px-3 py-2.5 text-center font-semibold">TA</th>
                  <th className="px-3 py-2.5 text-center font-semibold">FC</th>
                  <th className="px-3 py-2.5 text-center font-semibold">SpO₂</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Temp.</th>
                  <th className="px-3 py-2.5 text-center font-semibold">EVA</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Glycémie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...constantes].reverse().map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-gray-500 whitespace-nowrap">
                      {new Date(c.releveAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className={cn('px-3 py-2.5 text-center font-mono font-semibold', STATUS_STYLES[vitStatus('taSystolique', c.taSystolique)].val)}>
                      {c.taSystolique ? `${c.taSystolique}/${c.taDiastolique}` : '—'}
                    </td>
                    <td className={cn('px-3 py-2.5 text-center font-mono', STATUS_STYLES[vitStatus('fc', c.fc)].val)}>
                      {c.fc ?? '—'}
                    </td>
                    <td className={cn('px-3 py-2.5 text-center font-mono', STATUS_STYLES[vitStatus('spo2', c.spo2)].val)}>
                      {c.spo2 ? `${c.spo2}%` : '—'}
                    </td>
                    <td className={cn('px-3 py-2.5 text-center font-mono', STATUS_STYLES[vitStatus('temperature', c.temperature)].val)}>
                      {c.temperature ? `${c.temperature}°` : '—'}
                    </td>
                    <td className={cn('px-3 py-2.5 text-center font-mono', STATUS_STYLES[vitStatus('eva', c.eva)].val)}>
                      {c.eva !== null ? `${c.eva}/10` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-gray-600">
                      {c.glycemie ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AjouterConstantesModal visiteId={visiteId} open={addOpen} onClose={() => setAddOpen(false)} onMutate={onMutate} />
    </div>
  )
}
