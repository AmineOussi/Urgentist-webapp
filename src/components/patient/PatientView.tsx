'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PatientData, Visite } from './types'
import ConstantesTab   from './tabs/ConstantesTab'
import SoapTab         from './tabs/SoapTab'
import BilansTab       from './tabs/BilansTab'
import OrdonnancesTab  from './tabs/OrdonnancesTab'
import InfoPatientTab  from './tabs/InfoPatientTab'
import DocumentsTab    from './tabs/DocumentsTab'
import { Modal }       from '@/components/ui/modal'
import { Button }      from '@/components/ui/button'
import { useToast }    from '@/components/ui/toast'
import { DateInput }   from '@/components/ui/date-input'
import {
  SkeletonConstantesTab, SkeletonSoapTab,
  SkeletonBilansTab, SkeletonOrdonnancesTab, SkeletonInfoTab, SkeletonDocumentsTab,
} from '@/components/ui/skeleton'
import { useRefreshing } from '@/hooks/useRefreshing'
import { cn }          from '@/lib/utils'
import {
  ChevronLeft, User, AlertTriangle, Clock, Activity,
  FlaskConical, Pill, Heart, ChevronDown,
  CheckCircle2, XCircle, Loader2, Phone, Calendar,
  Droplets, Stethoscope, FolderOpen, Pencil,
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
  { id: 'constantes',  label: 'Constantes', icon: <Activity     className="w-4 h-4" /> },
  { id: 'soap',        label: 'SOAP',       icon: <Stethoscope  className="w-4 h-4" /> },
  { id: 'bilans',      label: 'Bilans',     icon: <FlaskConical className="w-4 h-4" /> },
  { id: 'ordonnances', label: 'Ordonnances',icon: <Pill         className="w-4 h-4" /> },
  { id: 'infos',       label: 'Infos',      icon: <Heart        className="w-4 h-4" /> },
  { id: 'documents',   label: 'Documents',  icon: <FolderOpen   className="w-4 h-4" /> },
] as const

type TabId = typeof TABS[number]['id']

// ── Edit patient modal ─────────────────────────────────────────
const GROUPE_SANGUIN = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

interface EditForm {
  nom: string; prenom: string; dateNaissance: string; sexe: string
  cin: string; telephone: string; groupeSanguin: string
  mutuelle: string; medecinTraitant: string
}

function EditPatientModal({ patient, open, onClose, onSaved }: {
  patient: PatientData; open: boolean; onClose: () => void; onSaved: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<EditForm>({
    nom:            patient.nom,
    prenom:         patient.prenom,
    dateNaissance:  patient.dateNaissance ?? '',
    sexe:           patient.sexe,
    cin:            patient.cin ?? '',
    telephone:      patient.telephone ?? '',
    groupeSanguin:  patient.groupeSanguin ?? '',
    mutuelle:       patient.mutuelle ?? '',
    medecinTraitant: patient.medecinTraitant ?? '',
  })

  // Re-sync when patient changes (e.g. after a refresh)
  const [synced, setSynced] = useState(false)
  if (!synced && open) {
    setForm({
      nom:            patient.nom,
      prenom:         patient.prenom,
      dateNaissance:  patient.dateNaissance ?? '',
      sexe:           patient.sexe,
      cin:            patient.cin ?? '',
      telephone:      patient.telephone ?? '',
      groupeSanguin:  patient.groupeSanguin ?? '',
      mutuelle:       patient.mutuelle ?? '',
      medecinTraitant: patient.medecinTraitant ?? '',
    })
    setSynced(true)
  }
  if (!open && synced) setSynced(false)

  function set(field: keyof EditForm, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function submit() {
    if (!form.nom.trim() || !form.prenom.trim()) {
      toast('error', 'Nom et prénom sont requis')
      return
    }
    setLoading(true)
    const res = await fetch(`/api/patients/${patient.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) {
      toast('success', 'Dossier patient mis à jour')
      onClose()
      onSaved()
    } else {
      const json = await res.json().catch(() => ({}))
      toast('error', json.error ?? 'Erreur lors de la mise à jour')
    }
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white'
  const selectCls = inputCls + ' cursor-pointer'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modifier le dossier patient"
      description="Les modifications sont enregistrées immédiatement dans la base de données."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button onClick={submit} loading={loading} icon={<Loader2 className={cn('w-4 h-4', loading ? 'animate-spin' : 'hidden')} />}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Identity */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom">
            <input className={inputCls} value={form.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Prénom" />
          </Field>
          <Field label="Nom">
            <input className={inputCls} value={form.nom} onChange={e => set('nom', e.target.value.toUpperCase())} placeholder="NOM" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date de naissance">
            <DateInput
              value={form.dateNaissance}
              onChange={v => set('dateNaissance', v)}
            />
          </Field>
          <Field label="Sexe">
            <select className={selectCls} value={form.sexe} onChange={e => set('sexe', e.target.value)}>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
              <option value="A">Autre</option>
            </select>
          </Field>
        </div>

        {/* Identification */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="CIN / N° pièce d'identité">
            <input className={inputCls} value={form.cin} onChange={e => set('cin', e.target.value)} placeholder="A212345" />
          </Field>
          <Field label="Téléphone">
            <input type="tel" className={inputCls} value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="06 XX XX XX XX" />
          </Field>
        </div>

        {/* Medical */}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Groupe sanguin">
            <select className={selectCls} value={form.groupeSanguin} onChange={e => set('groupeSanguin', e.target.value)}>
              <option value="">—</option>
              {GROUPE_SANGUIN.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Mutuelle / Assurance">
            <input className={inputCls} value={form.mutuelle} onChange={e => set('mutuelle', e.target.value)} placeholder="CNSS, CNOPS…" />
          </Field>
          <Field label="Médecin traitant">
            <input className={inputCls} value={form.medecinTraitant} onChange={e => set('medecinTraitant', e.target.value)} placeholder="Dr. Dupont" />
          </Field>
        </div>
      </div>
    </Modal>
  )
}

// ── Clôture visite modal ───────────────────────────────────────
const ORIENTATIONS = [
  { value: 'DOMICILE',        label: 'Retour à domicile' },
  { value: 'HOSPITALISATION', label: 'Hospitalisation' },
  { value: 'TRANSFERT',       label: 'Transfert vers autre service' },
  { value: 'DECES',           label: 'Décès' },
  { value: 'FUGUE',           label: 'Fugue / AMA' },
]

function ClotureVisiteModal({ visiteId, open, onClose, onMutate }: {
  visiteId: string; open: boolean; onClose: () => void; onMutate: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading]         = useState(false)
  const [orientation, setOrientation] = useState('DOMICILE')
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

// ── Main component ─────────────────────────────────────────────
interface PatientViewProps {
  patient: PatientData
  visite:  Visite | null
}

export default function PatientView({ patient, visite }: PatientViewProps) {
  const [activeTab,     setActiveTab]     = useState<TabId>('constantes')
  const [clotureOpen,   setClotureOpen]   = useState(false)
  const [editOpen,      setEditOpen]      = useState(false)
  const { refreshing, refresh }           = useRefreshing()

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
              {visite && (visite.statut === 'EN_ATTENTE' || visite.statut === 'EN_COURS') && (
                <Button
                  onClick={() => setClotureOpen(true)}
                  variant="outline"
                  size="xs"
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Clôturer
                </Button>
              )}
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
          </div>
        ) : refreshing ? (
          /* Per-tab skeleton shown during router.refresh() */
          <div className="animate-fade-in">
            {activeTab === 'constantes'  && <SkeletonConstantesTab />}
            {activeTab === 'soap'        && <SkeletonSoapTab />}
            {activeTab === 'bilans'      && <SkeletonBilansTab />}
            {activeTab === 'ordonnances' && <SkeletonOrdonnancesTab />}
            {activeTab === 'infos'       && <SkeletonInfoTab />}
            {activeTab === 'documents'   && <SkeletonDocumentsTab />}
          </div>
        ) : (
          <>
            {activeTab === 'constantes' && (
              <ConstantesTab
                constantes={visite.constantesVitales}
                visiteId={visite.id}
                onMutate={refresh}
              />
            )}
            {activeTab === 'soap' && (
              <SoapTab
                consultation={visite.consultation}
                visiteId={visite.id}
              />
            )}
            {activeTab === 'bilans' && (
              <BilansTab
                bilans={visite.bilans}
                visiteId={visite.id}
                onMutate={refresh}
              />
            )}
            {activeTab === 'ordonnances' && (
              <OrdonnancesTab
                prescriptions={visite.prescriptions}
                visiteId={visite.id}
                onMutate={refresh}
              />
            )}
            {activeTab === 'infos' && (
              <InfoPatientTab
                patientId={patient.id}
                allergies={patient.allergies}
                antecedents={patient.antecedents}
                onMutate={refresh}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentsTab
                patientId={patient.id}
                onMutate={refresh}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <EditPatientModal
        patient={patient}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={refresh}
      />
      {visite && (
        <ClotureVisiteModal
          visiteId={visite.id}
          open={clotureOpen}
          onClose={() => setClotureOpen(false)}
          onMutate={refresh}
        />
      )}
    </div>
  )
}
