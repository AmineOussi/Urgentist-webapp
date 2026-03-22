'use client'

import { useState } from 'react'
import type { Allergie, Antecedent } from '../types'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateInput } from '@/components/ui/date-input'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import {
  Plus, AlertTriangle, ShieldCheck, ShieldAlert,
  Heart, Activity, Syringe, Brain, Pill,
} from 'lucide-react'

// ── Severity config ────────────────────────────────────────────
const SEVERITE_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  LEGERE:   { label: 'Légère',    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',    dot: 'bg-yellow-400' },
  MODEREE:  { label: 'Modérée',   color: 'bg-orange-50 text-orange-700 border-orange-200',    dot: 'bg-orange-400' },
  SEVERE:   { label: 'Sévère',    color: 'bg-red-50    text-red-700    border-red-300',        dot: 'bg-red-500'   },
  FATALE:   { label: '⚠ Fatale',  color: 'bg-red-100   text-red-800    border-red-400',        dot: 'bg-red-700'   },
}

const ANTECEDENT_ICONS: Record<string, React.ReactNode> = {
  CHIRURGICAL:   <Syringe className="w-3.5 h-3.5" />,
  MEDICAL:       <Activity className="w-3.5 h-3.5" />,
  FAMILIAL:      <Heart className="w-3.5 h-3.5" />,
  ALLERGIE:      <AlertTriangle className="w-3.5 h-3.5" />,
  PSYCHOLOGIQUE: <Brain className="w-3.5 h-3.5" />,
  TRAITEMENT:    <Pill className="w-3.5 h-3.5" />,
}

const ANTECEDENT_COLORS: Record<string, string> = {
  CHIRURGICAL:   'bg-purple-50 text-purple-700',
  MEDICAL:       'bg-blue-50   text-blue-700',
  FAMILIAL:      'bg-pink-50   text-pink-700',
  ALLERGIE:      'bg-red-50    text-red-700',
  PSYCHOLOGIQUE: 'bg-indigo-50 text-indigo-700',
  TRAITEMENT:    'bg-teal-50   text-teal-700',
}

// ── Add allergy modal ──────────────────────────────────────────
function AddAllergieModal({ patientId, open, onClose, onMutate }: {
  patientId: string; open: boolean; onClose: () => void; onMutate: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ substance: '', severite: 'MODEREE', confirmee: true })

  async function submit() {
    if (!form.substance.trim()) return
    setLoading(true)
    const res = await fetch(`/api/patients/${patientId}/allergies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) {
      toast('success', 'Allergie ajoutée')
      setForm({ substance: '', severite: 'MODEREE', confirmee: true })
      onClose()
      onMutate()
    } else {
      toast('error', 'Erreur lors de l\'ajout')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Déclarer une allergie"
      description="Saisir la substance allergène et la sévérité de la réaction."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} loading={loading} variant="danger" disabled={!form.substance.trim()}>
            Ajouter
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Substance / Allergène"
          value={form.substance}
          onChange={e => setForm(p => ({ ...p, substance: e.target.value }))}
          placeholder="Ex: Pénicilline, Aspirine, Arachides…"
          autoFocus
        />
        <div>
          <label className="text-xs font-medium text-gray-700 mb-2 block">Sévérité</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(SEVERITE_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm(p => ({ ...p, severite: key }))}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all',
                  form.severite === key
                    ? cfg.color + ' border-current opacity-100'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300',
                )}
              >
                <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', cfg.dot)} />
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
        <label className={cn(
          'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
          form.confirmee ? 'bg-emerald-50 border-emerald-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300',
        )}>
          <input
            type="checkbox"
            checked={form.confirmee}
            onChange={e => setForm(p => ({ ...p, confirmee: e.target.checked }))}
            className="w-4 h-4 accent-emerald-600"
          />
          <div>
            <p className="text-sm font-semibold text-gray-800">Allergie confirmée</p>
            <p className="text-xs text-gray-400">Par test ou réaction documentée</p>
          </div>
        </label>
      </div>
    </Modal>
  )
}

// ── Add antécédent modal ───────────────────────────────────────
function AddAntecedentModal({ patientId, open, onClose, onMutate }: {
  patientId: string; open: boolean; onClose: () => void; onMutate: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ type: 'MEDICAL', description: '', dateDebut: '' })

  async function submit() {
    if (!form.description.trim()) return
    setLoading(true)
    const res = await fetch(`/api/patients/${patientId}/antecedents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, actif: true }),
    })
    setLoading(false)
    if (res.ok) {
      toast('success', 'Antécédent ajouté')
      setForm({ type: 'MEDICAL', description: '', dateDebut: '' })
      onClose()
      onMutate()
    } else {
      toast('error', 'Erreur lors de l\'ajout')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajouter un antécédent"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} loading={loading} disabled={!form.description.trim()}>
            Ajouter
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-2 block">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(ANTECEDENT_ICONS).map(([key, icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm(p => ({ ...p, type: key }))}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all',
                  form.type === key
                    ? (ANTECEDENT_COLORS[key] ?? 'bg-brand-50 text-brand-700') + ' border-current'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300',
                )}
              >
                {icon}
                {key.charAt(0) + key.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1.5 block">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={3}
            placeholder="Description de l'antécédent…"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date de début (optionnel)</label>
          <DateInput value={form.dateDebut} onChange={v => setForm(p => ({ ...p, dateDebut: v }))} />
        </div>
      </div>
    </Modal>
  )
}

// ── Main tab ───────────────────────────────────────────────────
interface Props {
  patientId: string
  allergies: Allergie[]
  antecedents: Antecedent[]
  onMutate: () => void
}

export default function InfoPatientTab({ patientId, allergies, antecedents, onMutate }: Props) {
  const [addAllergie, setAddAllergie]     = useState(false)
  const [addAntecedent, setAddAntecedent] = useState(false)

  const criticalAllergies = allergies.filter(a => a.severite === 'SEVERE' || a.severite === 'FATALE')

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── ALLERGIES ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold text-gray-900">Allergies</h2>
            {criticalAllergies.length > 0 && (
              <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                {criticalAllergies.length} critique{criticalAllergies.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Button onClick={() => setAddAllergie(true)} icon={<Plus className="w-3.5 h-3.5" />} size="xs" variant="ghost">
            Ajouter
          </Button>
        </div>

        {allergies.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center py-8 gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-300" />
            <p className="text-sm text-gray-400">Aucune allergie connue</p>
            <Button onClick={() => setAddAllergie(true)} variant="secondary" icon={<Plus className="w-3.5 h-3.5" />} size="xs">
              Déclarer une allergie
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card divide-y divide-gray-50 overflow-hidden">
            {allergies.map(a => {
              const cfg = SEVERITE_CONFIG[a.severite] ?? SEVERITE_CONFIG.MODEREE
              return (
                <div key={a.id} className={cn('flex items-center gap-4 px-4 py-3.5', (a.severite === 'SEVERE' || a.severite === 'FATALE') && 'bg-red-50/40')}>
                  <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', cfg.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{a.substance}</p>
                    {a.confirmee ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        <ShieldCheck className="w-2.5 h-2.5" /> Confirmée
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400">
                        <ShieldAlert className="w-2.5 h-2.5" /> Non confirmée
                      </span>
                    )}
                  </div>
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', cfg.color)}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── ANTÉCÉDENTS ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            <h2 className="text-sm font-bold text-gray-900">Antécédents médicaux</h2>
          </div>
          <Button onClick={() => setAddAntecedent(true)} icon={<Plus className="w-3.5 h-3.5" />} size="xs" variant="ghost">
            Ajouter
          </Button>
        </div>

        {antecedents.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center py-8 gap-2">
            <Heart className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-400">Aucun antécédent renseigné</p>
            <Button onClick={() => setAddAntecedent(true)} variant="secondary" icon={<Plus className="w-3.5 h-3.5" />} size="xs">
              Ajouter un antécédent
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card divide-y divide-gray-50 overflow-hidden">
            {antecedents.map(a => {
              const icon  = ANTECEDENT_ICONS[a.type]
              const color = ANTECEDENT_COLORS[a.type] ?? 'bg-gray-100 text-gray-600'
              return (
                <div key={a.id} className="flex items-start gap-4 px-4 py-3.5">
                  <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5', color)}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{a.description}</p>
                      <span className={cn('text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full', color)}>
                        {a.type.charAt(0) + a.type.slice(1).toLowerCase()}
                      </span>
                    </div>
                    {a.dateDebut && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Depuis {new Date(a.dateDebut).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Modals */}
      <AddAllergieModal patientId={patientId} open={addAllergie} onClose={() => setAddAllergie(false)} onMutate={onMutate} />
      <AddAntecedentModal patientId={patientId} open={addAntecedent} onClose={() => setAddAntecedent(false)} onMutate={onMutate} />
    </div>
  )
}
