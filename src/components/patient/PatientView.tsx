'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PatientData, Visite } from './types'
import ConstantesTab      from './tabs/ConstantesTab'
import SoapTab            from './tabs/SoapTab'
import BilansTab          from './tabs/BilansTab'
import OrdonnancesTab     from './tabs/OrdonnancesTab'
import InfoPatientTab     from './tabs/InfoPatientTab'
import DocumentsTab       from './tabs/DocumentsTab'
import HistoriqueTab      from './tabs/HistoriqueTab'
import VueGeneraleTab     from './tabs/VueGeneraleTab'
import EditPatientModal   from './EditPatientModal'
import { Modal }          from '@/components/ui/modal'
import { Button }         from '@/components/ui/button'
import { useToast }       from '@/components/ui/toast'
import {
  SkeletonConstantesTab, SkeletonSoapTab,
  SkeletonBilansTab, SkeletonOrdonnancesTab, SkeletonInfoTab, SkeletonDocumentsTab,
  SkeletonHistoriqueTab, SkeletonVueGeneraleTab,
} from '@/components/ui/skeleton'
import { useRefreshing } from '@/hooks/useRefreshing'
import { cn }          from '@/lib/utils'
import {
  ChevronLeft, User, AlertTriangle, Clock, Activity,
  FlaskConical, Pill, Heart, ChevronDown,
  CheckCircle2, XCircle, Phone, Calendar,
  Droplets, Stethoscope, FolderOpen, Pencil, History,
  ShieldAlert, BookOpen, ChevronUp, Play, Plus,
  ArrowRight, CircleDot, LogOut,
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────
function age(dob: string | null) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

function initials(nom: string, prenom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
}

// ── Triage ─────────────────────────────────────────────────────
const TRIAGE_CONFIG: Record<string, { bg: string; text: string; ring: string; label: string; pulse?: boolean }> = {
  P1: { bg: 'bg-red-600',    text: 'text-white',      ring: 'ring-red-600',    label: 'P1 — Urgence absolue', pulse: true },
  P2: { bg: 'bg-orange-500', text: 'text-white',      ring: 'ring-orange-500', label: 'P2 — Urgence relative' },
  P3: { bg: 'bg-yellow-400', text: 'text-gray-800',   ring: 'ring-yellow-400', label: 'P3 — Semi-urgent' },
  P4: { bg: 'bg-green-500',  text: 'text-white',      ring: 'ring-green-500',  label: 'P4 — Non-urgent' },
}

const STATUT_VISITE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  EN_ATTENTE: { label: 'En attente',    color: 'bg-amber-100 text-amber-700',   icon: <Clock       className="w-3.5 h-3.5" /> },
  EN_COURS:   { label: 'En cours',      color: 'bg-blue-100  text-blue-700',    icon: <Activity    className="w-3.5 h-3.5" /> },
  TERMINE:    { label: 'Clôturé',       color: 'bg-gray-100  text-gray-600',    icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  TRANSFERE:  { label: 'Transféré',     color: 'bg-purple-100 text-purple-700', icon: <XCircle     className="w-3.5 h-3.5" /> },
}

// ── Tab definitions ────────────────────────────────────────────
const TABS = [
  { id: 'vue',         label: 'Vue générale',icon: <User         className="w-4 h-4" /> },
  { id: 'constantes',  label: 'Constantes', icon: <Activity     className="w-4 h-4" /> },
  { id: 'soap',        label: 'SOAP',       icon: <Stethoscope  className="w-4 h-4" /> },
  { id: 'bilans',      label: 'Bilans',     icon: <FlaskConical className="w-4 h-4" /> },
  { id: 'ordonnances', label: 'Ordonnances',icon: <Pill         className="w-4 h-4" /> },
  { id: 'infos',       label: 'Infos',      icon: <Heart        className="w-4 h-4" /> },
  { id: 'documents',   label: 'Documents',  icon: <FolderOpen   className="w-4 h-4" /> },
  { id: 'historique',  label: 'Historique', icon: <History      className="w-4 h-4" /> },
] as const

type TabId = typeof TABS[number]['id']

// ── Allergy + antecedent severity config ───────────────────────
const SEVERITY: Record<string, { label: string; bg: string; text: string; border: string; pulse: boolean }> = {
  FATALE:   { label: 'Fatale',   bg: 'bg-red-600',    text: 'text-white',      border: 'border-red-600',    pulse: true  },
  SEVERE:   { label: 'Sévère',   bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-400',    pulse: true  },
  MODEREE:  { label: 'Modérée',  bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', pulse: false },
  LEGERE:   { label: 'Légère',   bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-300', pulse: false },
}

const ANTECEDENT_TYPE: Record<string, { label: string; color: string }> = {
  medical:     { label: 'Médical',     color: 'bg-blue-100 text-blue-700 border-blue-200' },
  chirurgical: { label: 'Chir.',       color: 'bg-violet-100 text-violet-700 border-violet-200' },
  familial:    { label: 'Familial',    color: 'bg-teal-100 text-teal-700 border-teal-200' },
  allergie:    { label: 'Allergie',    color: 'bg-red-100 text-red-700 border-red-200' },
  autre:       { label: 'Autre',       color: 'bg-gray-100 text-gray-600 border-gray-200' },
}

function AllergyAntecedentPanel({ allergies, antecedents, onGotoInfos }: {
  allergies:   import('./types').Allergie[]
  antecedents: import('./types').Antecedent[]
  onGotoInfos: () => void
}) {
  const hasCritical = allergies.some(a => a.severite === 'FATALE' || a.severite === 'SEVERE')
  const hasAllergies    = allergies.length > 0
  const hasAntecedents  = antecedents.length > 0
  if (!hasAllergies && !hasAntecedents) return null

  return (
    <div className="border-t border-gray-100 divide-y divide-gray-100">

      {/* ── Allergies row ── */}
      {hasAllergies && (
        <button
          type="button"
          onClick={onGotoInfos}
          title="Voir les allergies"
          className={cn(
            'w-full flex items-start gap-3 px-5 sm:px-6 py-3 text-left group transition-colors',
            hasCritical ? 'bg-red-50 hover:bg-red-100/70' : 'bg-orange-50/60 hover:bg-orange-100/60',
          )}
        >
          <ShieldAlert className={cn(
            'w-4 h-4 shrink-0 mt-0.5',
            hasCritical ? 'text-red-600 animate-pulse' : 'text-orange-500',
          )} />
          <div className="flex-1 min-w-0">
            <p className={cn('text-xs font-bold uppercase tracking-widest mb-1.5', hasCritical ? 'text-red-500' : 'text-orange-500')}>
              Allergies ({allergies.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {allergies.map(a => {
                const sev = SEVERITY[a.severite] ?? SEVERITY.LEGERE
                return (
                  <span
                    key={a.id}
                    className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border',
                      sev.bg, sev.text, sev.border,
                      sev.pulse && 'animate-pulse',
                    )}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {a.substance}
                    <span className="font-normal opacity-70">— {sev.label}</span>
                  </span>
                )
              })}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-0.5 -rotate-90 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* ── Antécédents row ── */}
      {hasAntecedents && (
        <button
          type="button"
          onClick={onGotoInfos}
          title="Voir les antécédents"
          className="w-full flex items-start gap-3 px-5 sm:px-6 py-3 text-left bg-blue-50/50 hover:bg-blue-100/50 group transition-colors"
        >
          <BookOpen className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1.5">
              Antécédents actifs ({antecedents.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {antecedents.map(ant => {
                const cfg = ANTECEDENT_TYPE[ant.type] ?? ANTECEDENT_TYPE.autre
                return (
                  <span
                    key={ant.id}
                    className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border', cfg.color)}
                  >
                    <span className="font-semibold">{cfg.label}</span>
                    <span className="opacity-80">{ant.description}</span>
                  </span>
                )
              })}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-0.5 -rotate-90 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  )
}

// ── Clôture visite modal ───────────────────────────────────────
const ORIENTATIONS = [
  { value: 'SORTIE_DOMICILE',  label: 'Retour à domicile' },
  { value: 'HOSPITALISATION',  label: 'Hospitalisation' },
  { value: 'TRANSFERT_SAMU',   label: 'Transfert SAMU' },
  { value: 'OBSERVATION_UHCD', label: 'Observation UHCD' },
  { value: 'DECES',            label: 'Décès' },
]

function ClotureVisiteModal({ visiteId, open, onClose, onMutate }: {
  visiteId: string; open: boolean; onClose: () => void; onMutate: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading]         = useState(false)
  const [orientation, setOrientation] = useState('SORTIE_DOMICILE')
  const [diagnostic, setDiagnostic]   = useState('')

  async function submit() {
    setLoading(true)
    const res = await fetch(`/api/visites/${visiteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'TERMINE', orientation, diagnostic }),
    })
    setLoading(false)
    if (res.ok) {
      toast('success', 'Visite clôturée')
      onClose()
      onMutate()
    } else {
      toast('error', 'Erreur lors de la clôture')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Clôturer la visite"
      description="Indiquer l'orientation du patient et le diagnostic final."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} loading={loading}>Confirmer la clôture</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-2 block">Orientation à la sortie</label>
          <div className="space-y-2">
            {ORIENTATIONS.map(o => (
              <label
                key={o.value}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all',
                  orientation === o.value
                    ? 'bg-brand-50 border-brand-500 text-brand-700'
                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700',
                )}
              >
                <input
                  type="radio"
                  value={o.value}
                  checked={orientation === o.value}
                  onChange={() => setOrientation(o.value)}
                  className="accent-brand-600"
                />
                <span className="text-sm font-medium">{o.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1.5 block">Diagnostic final (optionnel)</label>
          <input
            value={diagnostic}
            onChange={e => setDiagnostic(e.target.value)}
            placeholder="Ex: Pneumonie communautaire, I48.0…"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>
    </Modal>
  )
}

// ── Visit selector dropdown ────────────────────────────────────
function VisitSelector({
  visites,
  activeId,
}: {
  visites: PatientData['visites']
  activeId: string | null
}) {
  const [open, setOpen] = useState(false)

  if (visites.length <= 1) return null

  const active = visites.find(v => v.id === activeId) ?? visites[0]
  const tc = active ? (TRIAGE_CONFIG[active.triage] ?? TRIAGE_CONFIG.P4) : null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
      >
        {tc && <span className={cn('w-2 h-2 rounded-full', tc.bg)} />}
        {active ? (
          <span className="text-gray-700 max-w-[140px] truncate">
            Visite du {new Date(active.triageAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
          </span>
        ) : 'Sélectionner visite'}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 bg-white border border-gray-200 rounded-2xl shadow-modal w-64 overflow-hidden">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-4 pt-3 pb-2">
              Visites ({visites.length})
            </p>
            <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
              {visites.map(v => {
                const cfg = TRIAGE_CONFIG[v.triage] ?? TRIAGE_CONFIG.P4
                const sc  = STATUT_VISITE[v.statut]
                return (
                  <Link
                    key={v.id}
                    href={`?visite=${v.id}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors',
                      v.id === activeId && 'bg-brand-50',
                    )}
                  >
                    <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', cfg.bg)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800">
                        {new Date(v.triageAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      {v.motif && <p className="text-[11px] text-gray-400 truncate">{v.motif}</p>}
                    </div>
                    {sc && (
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', sc.color)}>
                        {sc.label}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Lifecycle stepper ──────────────────────────────────────────
const LIFECYCLE_STEPS = [
  { key: 'EN_ATTENTE', label: 'En attente',   icon: <Clock className="w-4 h-4" /> },
  { key: 'EN_COURS',   label: 'En cours',     icon: <Activity className="w-4 h-4" /> },
  { key: 'TERMINE',    label: 'Clôturé',      icon: <CheckCircle2 className="w-4 h-4" /> },
] as const

const STEP_INDEX: Record<string, number> = { EN_ATTENTE: 0, EN_COURS: 1, TERMINE: 2, TRANSFERE: 2 }

function LifecycleStepper({ statut }: { statut: string }) {
  const current = STEP_INDEX[statut] ?? 0

  return (
    <div className="flex items-center gap-1">
      {LIFECYCLE_STEPS.map((step, i) => {
        const isDone    = i < current
        const isCurrent = i === current
        return (
          <div key={step.key} className="flex items-center gap-1">
            {i > 0 && (
              <div className={cn(
                'w-6 h-0.5 rounded-full transition-colors',
                isDone ? 'bg-brand-500' : 'bg-gray-200',
              )} />
            )}
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all',
              isDone    && 'bg-brand-100 text-brand-700',
              isCurrent && 'bg-brand-600 text-white shadow-sm',
              !isDone && !isCurrent && 'bg-gray-100 text-gray-400',
            )}>
              {step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Lifecycle action bar ──────────────────────────────────────
function LifecycleActions({
  visite,
  patientId,
  onPriseEnCharge,
  onCloture,
  onNouvelleVisite,
  loading,
}: {
  visite: Visite | null
  patientId: string
  onPriseEnCharge: () => void
  onCloture: () => void
  onNouvelleVisite: () => void
  loading: boolean
}) {
  if (!visite) {
    return (
      <Button
        onClick={onNouvelleVisite}
        size="sm"
        icon={<Plus className="w-3.5 h-3.5" />}
      >
        Nouvelle visite
      </Button>
    )
  }

  if (visite.statut === 'EN_ATTENTE') {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={onPriseEnCharge}
          loading={loading}
          size="sm"
          icon={<Play className="w-3.5 h-3.5" />}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm animate-pulse hover:animate-none"
        >
          Prendre en charge
        </Button>
      </div>
    )
  }

  if (visite.statut === 'EN_COURS') {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          <CircleDot className="w-3 h-3 animate-pulse" />
          En cours
        </span>
        <Button
          onClick={onCloture}
          variant="outline"
          size="sm"
          icon={<LogOut className="w-3.5 h-3.5" />}
        >
          Clôturer
        </Button>
      </div>
    )
  }

  // TERMINE / TRANSFERE
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        {visite.statut === 'TRANSFERE' ? 'Transféré' : 'Clôturé'}
      </span>
      <Button
        onClick={onNouvelleVisite}
        variant="outline"
        size="sm"
        icon={<Plus className="w-3.5 h-3.5" />}
      >
        Nouvelle visite
      </Button>
    </div>
  )
}

// ── Nouvelle visite modal ─────────────────────────────────────
const TRIAGE_OPTIONS = [
  { value: 'P1', label: 'P1 — Urgence absolue', color: 'bg-red-600 text-white border-red-600' },
  { value: 'P2', label: 'P2 — Urgence relative', color: 'bg-orange-500 text-white border-orange-500' },
  { value: 'P3', label: 'P3 — Semi-urgent',      color: 'bg-yellow-400 text-gray-800 border-yellow-400' },
  { value: 'P4', label: 'P4 — Non-urgent',        color: 'bg-green-500 text-white border-green-500' },
]

function NouvelleVisiteModal({ patientId, patientCin, open, onClose, onCreated }: {
  patientId: string; patientCin: string | null; open: boolean; onClose: () => void; onCreated: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [triage, setTriage]   = useState('P3')
  const [motif, setMotif]     = useState('')

  async function submit() {
    if (!motif.trim()) {
      toast('error', 'Le motif est requis')
      return
    }
    setLoading(true)
    const res = await fetch('/api/visites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cin: patientCin, triage, motif: motif.trim() }),
    })
    setLoading(false)
    if (res.ok) {
      toast('success', 'Visite créée')
      setMotif('')
      setTriage('P3')
      onClose()
      onCreated()
    } else {
      const data = await res.json().catch(() => ({}))
      toast('error', data.error || 'Erreur lors de la création')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouvelle visite"
      description="Créer une nouvelle visite aux urgences pour ce patient."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} loading={loading} icon={<Plus className="w-3.5 h-3.5" />}>
            Créer la visite
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-2 block">Niveau de triage</label>
          <div className="grid grid-cols-2 gap-2">
            {TRIAGE_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => setTriage(o.value)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all',
                  triage === o.value
                    ? o.color
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300',
                )}
              >
                <span className={cn(
                  'w-3 h-3 rounded-full shrink-0',
                  o.value === 'P1' && 'bg-red-600',
                  o.value === 'P2' && 'bg-orange-500',
                  o.value === 'P3' && 'bg-yellow-400',
                  o.value === 'P4' && 'bg-green-500',
                  triage === o.value && 'ring-2 ring-white',
                )} />
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1.5 block">
            Motif d&apos;admission <span className="text-red-500">*</span>
          </label>
          <input
            value={motif}
            onChange={e => setMotif(e.target.value)}
            placeholder="Ex: Douleur thoracique, chute, dyspnée…"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            autoFocus
          />
        </div>
      </div>
    </Modal>
  )
}

// ── Main component ─────────────────────────────────────────────
interface PatientViewProps {
  patient: PatientData
  visite:  Visite | null
}

export default function PatientView({ patient, visite }: PatientViewProps) {
  const [activeTab,     setActiveTab]     = useState<TabId>('vue')
  const [clotureOpen,   setClotureOpen]   = useState(false)
  const [editOpen,      setEditOpen]      = useState(false)
  const [newVisiteOpen, setNewVisiteOpen] = useState(false)
  const [pecLoading,    setPecLoading]    = useState(false)
  const { refreshing, refresh }           = useRefreshing()
  const { toast }                         = useToast()

  async function handlePriseEnCharge() {
    if (!visite) return
    setPecLoading(true)
    const res = await fetch(`/api/visites/${visite.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'EN_COURS' }),
    })
    setPecLoading(false)
    if (res.ok) {
      toast('success', 'Patient pris en charge')
      refresh()
    } else {
      toast('error', 'Erreur lors de la prise en charge')
    }
  }

  const isTermine     = visite?.statut === 'TERMINE' || visite?.statut === 'TRANSFERE'
  const tc            = visite ? (TRIAGE_CONFIG[visite.triage] ?? TRIAGE_CONFIG.P4) : null
  const statutConfig  = visite ? (STATUT_VISITE[visite.statut] ?? STATUT_VISITE.EN_ATTENTE) : null
  const patientAge    = age(patient.dateNaissance)
  const hasCritique   = visite?.bilans.some(b => b.isCritique && b.resultat) ?? false
  const hasCriticalAllergy = patient.allergies.some(a => a.severite === 'SEVERE' || a.severite === 'FATALE')

  // Badge counts for tab indicators
  const critiqueBilans    = visite?.bilans.filter(b => b.isCritique).length ?? 0
  const draftOrdonnances  = visite?.prescriptions.filter(p => p.isDraft).length ?? 0
  const allergyCount      = patient.allergies.filter(a => a.severite === 'SEVERE' || a.severite === 'FATALE').length

  return (
    <div className="min-h-screen bg-[#F0F4F8]">

      {/* ── Refresh progress bar ── */}
      {refreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-gray-100 overflow-hidden">
          <div className="h-full bg-brand-500 animate-[shimmer_1.2s_ease-in-out_infinite]" style={{ width: '60%' }} />
        </div>
      )}

      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Top bar: back + visit selector */}
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <Link
              href="/patients"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Patients</span>
            </Link>

            <div className="flex items-center gap-2">
              {visite && (
                <VisitSelector
                  visites={patient.visites}
                  activeId={visite.id}
                />
              )}
              {visite && <LifecycleStepper statut={visite.statut} />}
            </div>
          </div>

          {/* Patient identity row */}
          <div className="flex items-center gap-4 py-4">
            {/* Avatar */}
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-sm',
              patient.sexe === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700',
            )}>
              {initials(patient.nom, patient.prenom)}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-black text-gray-900 leading-tight">
                  {patient.prenom} {patient.nom.toUpperCase()}
                </h1>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  title="Modifier le dossier patient"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {tc && (
                  <span className={cn(
                    'inline-flex items-center text-xs font-black px-2.5 py-1 rounded-xl',
                    tc.bg, tc.text,
                    tc.pulse && 'animate-pulse',
                  )}>
                    {visite?.triage}
                  </span>
                )}
                {statutConfig && (
                  <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full', statutConfig.color)}>
                    {statutConfig.icon} {statutConfig.label}
                  </span>
                )}
                {hasCriticalAllergy && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full border border-red-200 animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> Allergie critique
                  </span>
                )}
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {patientAge && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {patientAge} ans
                  </span>
                )}
                {patient.sexe && (
                  <span className="text-xs text-gray-500">
                    {patient.sexe === 'M' ? 'Homme' : patient.sexe === 'F' ? 'Femme' : patient.sexe}
                  </span>
                )}
                {patient.groupeSanguin && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    <Droplets className="w-3 h-3" /> {patient.groupeSanguin}
                  </span>
                )}
                {patient.telephone && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Phone className="w-3 h-3" /> {patient.telephone}
                  </span>
                )}
                {visite?.motif && (
                  <span className="text-xs text-gray-500">
                    <span className="text-gray-400">Motif:</span> {visite.motif}
                  </span>
                )}
                {visite?.box && (
                  <span className="text-xs font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                    {visite.box.nom}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Lifecycle action bar ── */}
          <div className="flex items-center justify-between py-3 border-t border-gray-50">
            <div className="flex items-center gap-2">
              {visite?.triageAt && (
                <span className="text-xs text-gray-400">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Arrivée {new Date(visite.triageAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {visite?.statut === 'EN_COURS' && visite.triageAt && (
                <span className="text-xs text-gray-400">
                  &middot; Attente {Math.round((Date.now() - new Date(visite.triageAt).getTime()) / 60000)} min
                </span>
              )}
            </div>
            <LifecycleActions
              visite={visite}
              patientId={patient.id}
              onPriseEnCharge={handlePriseEnCharge}
              onCloture={() => setClotureOpen(true)}
              onNouvelleVisite={() => setNewVisiteOpen(true)}
              loading={pecLoading}
            />
          </div>

          {/* ── Allergies + Antécédents strip ── */}
          <AllergyAntecedentPanel
            allergies={patient.allergies}
            antecedents={patient.antecedents}
            onGotoInfos={() => setActiveTab('infos')}
          />

          {/* Critical bilans banner (above tabs) */}
          {hasCritique && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Résultats critiques — vérifier l&apos;onglet Bilans
            </div>
          )}

          {/* ── Tab navigation ── */}
          <div className="flex items-center gap-0.5 overflow-x-auto pb-0 scrollbar-none">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              let badgeCount = 0
              if (tab.id === 'bilans' && critiqueBilans > 0)   badgeCount = critiqueBilans
              if (tab.id === 'ordonnances' && draftOrdonnances > 0) badgeCount = draftOrdonnances
              if (tab.id === 'infos' && allergyCount > 0)      badgeCount = allergyCount

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2',
                    isActive
                      ? 'text-brand-700 border-brand-600 bg-brand-50/60'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50',
                  )}
                >
                  <span className={cn(isActive ? 'text-brand-600' : 'text-gray-400')}>
                    {tab.icon}
                  </span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {badgeCount > 0 && (
                    <span className={cn(
                      'absolute -top-0.5 right-1.5 min-w-[16px] h-4 rounded-full text-[10px] font-black flex items-center justify-center px-1',
                      tab.id === 'bilans'      ? 'bg-red-500 text-white'    :
                      tab.id === 'ordonnances' ? 'bg-amber-500 text-white'  :
                      'bg-red-500 text-white',
                    )}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {!visite ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center py-20 gap-4">
            <User className="w-12 h-12 text-gray-300" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-500">Aucune visite active</p>
              <p className="text-xs text-gray-400 mt-1">Créez une nouvelle visite pour commencer la prise en charge</p>
            </div>
            <Button
              onClick={() => setNewVisiteOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Nouvelle visite
            </Button>
          </div>
        ) : refreshing ? (
          /* Per-tab skeleton shown during router.refresh() */
          <div className="animate-fade-in">
            {activeTab === 'vue'         && <SkeletonVueGeneraleTab />}
            {activeTab === 'constantes'  && <SkeletonConstantesTab />}
            {activeTab === 'soap'        && <SkeletonSoapTab />}
            {activeTab === 'bilans'      && <SkeletonBilansTab />}
            {activeTab === 'ordonnances' && <SkeletonOrdonnancesTab />}
            {activeTab === 'infos'       && <SkeletonInfoTab />}
            {activeTab === 'documents'   && <SkeletonDocumentsTab />}
            {activeTab === 'historique'  && <SkeletonHistoriqueTab />}
          </div>
        ) : (
          <>
            {activeTab === 'vue' && (
              <VueGeneraleTab
                patient={patient}
                visite={visite}
                onTabChange={setActiveTab}
              />
            )}
            {activeTab === 'constantes' && (
              <ConstantesTab
                constantes={visite.constantesVitales}
                visiteId={visite.id}
                onMutate={refresh}
                readOnly={isTermine}
              />
            )}
            {activeTab === 'soap' && (
              <SoapTab
                consultation={visite.consultation}
                visiteId={visite.id}
                onSaved={refresh}
                readOnly={isTermine}
              />
            )}
            {activeTab === 'bilans' && (
              <BilansTab
                bilans={visite.bilans}
                visiteId={visite.id}
                onMutate={refresh}
                readOnly={isTermine}
              />
            )}
            {activeTab === 'ordonnances' && (
              <OrdonnancesTab
                prescriptions={visite.prescriptions}
                visiteId={visite.id}
                onMutate={refresh}
                readOnly={isTermine}
              />
            )}
            {activeTab === 'infos' && (
              <InfoPatientTab
                patientId={patient.id}
                allergies={patient.allergies}
                antecedents={patient.antecedents}
                onMutate={refresh}
                readOnly={isTermine}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentsTab
                patientId={patient.id}
                onMutate={refresh}
                readOnly={isTermine}
              />
            )}
            {activeTab === 'historique' && (
              <HistoriqueTab
                patientId={patient.id}
                patientCreatedAt={(patient as any).createdAt}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {editOpen && (
        <EditPatientModal
          patient={patient}
          onClose={() => setEditOpen(false)}
          onSaved={refresh}
        />
      )}
      {visite && (
        <ClotureVisiteModal
          visiteId={visite.id}
          open={clotureOpen}
          onClose={() => setClotureOpen(false)}
          onMutate={refresh}
        />
      )}
      <NouvelleVisiteModal
        patientId={patient.id}
        patientCin={patient.cin}
        open={newVisiteOpen}
        onClose={() => setNewVisiteOpen(false)}
        onCreated={refresh}
      />
    </div>
  )
}
