'use client'

// ──────────────────────────────────────────────────────────────
//  VueGeneraleTab — At-a-glance overview of all critical info
// ──────────────────────────────────────────────────────────────
import { cn } from '@/lib/utils'
import type { PatientData, Visite } from '../types'
import {
  AlertTriangle, ShieldAlert, BookOpen, Activity, Clock,
  CheckCircle2, Stethoscope, FlaskConical, Pill, User,
  Phone, Calendar, Droplets, Briefcase, Heart, ChevronRight,
  Thermometer, TrendingUp, FileText, XCircle,
} from 'lucide-react'

type TabId =
  | 'vue' | 'constantes' | 'soap' | 'bilans'
  | 'ordonnances' | 'infos' | 'documents' | 'historique'

interface Props {
  patient:     PatientData
  visite:      Visite | null
  onTabChange: (tab: TabId) => void
}

// ── Config ─────────────────────────────────────────────────────
const TRIAGE_CONFIG: Record<string, { bg: string; text: string; label: string; pulse?: boolean }> = {
  P1: { bg: 'bg-red-600',    text: 'text-white',    label: 'Urgence absolue',  pulse: true },
  P2: { bg: 'bg-orange-500', text: 'text-white',    label: 'Urgence relative' },
  P3: { bg: 'bg-yellow-400', text: 'text-gray-900', label: 'Semi-urgent' },
  P4: { bg: 'bg-green-500',  text: 'text-white',    label: 'Non-urgent' },
}
const SEVERITY_CONFIG: Record<string, { bg: string; text: string; border: string; pulse: boolean }> = {
  FATALE:  { bg: 'bg-red-600',    text: 'text-white',      border: 'border-red-600',    pulse: true },
  SEVERE:  { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-400',    pulse: true },
  MODEREE: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', pulse: false },
  LEGERE:  { bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-300', pulse: false },
}
const SEV_LABEL: Record<string, string> = {
  FATALE: 'Fatale', SEVERE: 'Sévère', MODEREE: 'Modérée', LEGERE: 'Légère',
}
const ANT_TYPE: Record<string, { label: string; color: string }> = {
  medical:     { label: 'Médical',     color: 'bg-blue-100 text-blue-700 border-blue-200' },
  chirurgical: { label: 'Chirurgical', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  familial:    { label: 'Familial',    color: 'bg-teal-100 text-teal-700 border-teal-200' },
  allergie:    { label: 'Allergie',    color: 'bg-red-100 text-red-700 border-red-200' },
  autre:       { label: 'Autre',       color: 'bg-gray-100 text-gray-600 border-gray-200' },
}
const ORIENTATION_LABEL: Record<string, string> = {
  SORTIE_DOMICILE: 'Retour domicile', HOSPITALISATION: 'Hospitalisé',
  TRANSFERT_SAMU: 'Transféré SAMU', OBSERVATION_UHCD: 'Observation UHCD', DECES: 'Décès',
}

function age(dob: string | null) {
  if (!dob) return null
  const y = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  return y >= 0 ? y : null
}
function sinceText(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h${mins % 60 > 0 ? String(mins % 60).padStart(2, '0') : ''}`
  return `${Math.floor(hrs / 24)}j`
}

// ── Card wrapper ───────────────────────────────────────────────
function Card({
  title, icon, iconBg, onClick, children, urgent,
}: {
  title: string; icon: React.ReactNode; iconBg: string
  onClick?: () => void; children: React.ReactNode; urgent?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'w-full bg-white rounded-2xl border overflow-hidden text-left group transition-all',
        urgent ? 'border-red-200 shadow-red-100 shadow-md' : 'border-gray-100 shadow-sm',
        onClick && 'hover:shadow-md hover:border-brand-200 cursor-pointer',
      )}
    >
      <div className={cn(
        'flex items-center justify-between px-4 py-3 border-b',
        urgent ? 'bg-red-50 border-red-100' : 'bg-gray-50/80 border-gray-50',
      )}>
        <div className="flex items-center gap-2.5">
          <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center', iconBg)}>
            {icon}
          </div>
          <span className={cn('text-sm font-bold', urgent ? 'text-red-700' : 'text-gray-800')}>
            {title}
          </span>
        </div>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
        )}
      </div>
      <div className="px-4 py-3">{children}</div>
    </Tag>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-medium shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right">{value || '—'}</span>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────
export default function VueGeneraleTab({ patient, visite, onTabChange }: Props) {
  const patAge     = age(patient.dateNaissance)
  const tc         = visite ? TRIAGE_CONFIG[visite.triage] : null
  const hasCritAllergy = patient.allergies.some(a => a.severite === 'FATALE' || a.severite === 'SEVERE')
  const hasCritBilan   = visite?.bilans.some(b => b.isCritique && b.resultat) ?? false
  const lastConstante  = visite?.constantesVitales.at(-1) ?? null
  const pendingBilans  = visite?.bilans.filter(b => b.statut === 'EN_ATTENTE' || b.statut === 'ENVOYE') ?? []
  const draftOrdo      = visite?.prescriptions.filter(p => p.isDraft) ?? []
  const activeOrdo     = visite?.prescriptions.filter(p => !p.isDraft) ?? []

  return (
    <div className="space-y-4">

      {/* ── Critical alerts ── */}
      {(hasCritAllergy || hasCritBilan) && (
        <div className="flex flex-col gap-2">
          {hasCritAllergy && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-red-600 rounded-xl text-white animate-pulse">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-sm font-bold">
                Allergie critique —{' '}
                {patient.allergies.filter(a => a.severite === 'FATALE' || a.severite === 'SEVERE')
                  .map(a => a.substance).join(', ')}
              </span>
            </div>
          )}
          {hasCritBilan && (
            <button
              onClick={() => onTabChange('bilans')}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
              <span className="text-sm font-semibold flex-1 text-left">Résultats de bilans critiques</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── Visite en cours ── */}
        {visite ? (
          <Card
            title="Visite en cours"
            icon={<Activity className="w-4 h-4 text-brand-600" />}
            iconBg="bg-brand-50"
            urgent={visite.triage === 'P1'}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                {tc && (
                  <span className={cn(
                    'text-sm font-black px-3 py-1 rounded-xl',
                    tc.bg, tc.text, tc.pulse && 'animate-pulse',
                  )}>
                    {visite.triage}
                  </span>
                )}
                {tc && <span className="text-sm font-semibold text-gray-600">{tc.label}</span>}
              </div>
              {visite.motif && <Row label="Motif" value={visite.motif} />}
              {visite.box   && <Row label="Box" value={visite.box.nom} />}
              <Row label="Depuis" value={sinceText(visite.triageAt)} />
              {visite.orientation && (
                <Row label="Orientation" value={ORIENTATION_LABEL[visite.orientation] ?? visite.orientation} />
              )}
              <Row label="Statut" value={
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                  visite.statut === 'EN_ATTENTE' ? 'bg-amber-100 text-amber-700' :
                  visite.statut === 'EN_COURS'   ? 'bg-blue-100 text-blue-700'   :
                  'bg-gray-100 text-gray-600'
                )}>
                  {visite.statut === 'EN_ATTENTE' ? 'En attente' :
                   visite.statut === 'EN_COURS'   ? 'En cours' : 'Clôturé'}
                </span>
              } />
            </div>
          </Card>
        ) : (
          <Card
            title="Visite"
            icon={<Activity className="w-4 h-4 text-gray-400" />}
            iconBg="bg-gray-100"
          >
            <p className="text-sm text-gray-400 py-2">Aucune visite active</p>
          </Card>
        )}

        {/* ── Patient identity ── */}
        <Card
          title="Identité"
          icon={<User className="w-4 h-4 text-blue-600" />}
          iconBg="bg-blue-50"
          onClick={() => onTabChange('infos')}
        >
          <div className="space-y-0">
            {patAge !== null && <Row label="Âge" value={`${patAge} ans`} />}
            <Row label="Sexe" value={patient.sexe === 'M' ? 'Masculin' : patient.sexe === 'F' ? 'Féminin' : patient.sexe} />
            {patient.cin       && <Row label="CIN" value={<span className="font-mono">{patient.cin}</span>} />}
            {patient.telephone && <Row label="Téléphone" value={patient.telephone} />}
            {patient.groupeSanguin && (
              <Row label="Groupe sanguin" value={
                <span className="font-black text-red-600 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" /> {patient.groupeSanguin}
                </span>
              } />
            )}
            {patient.mutuelle        && <Row label="Mutuelle" value={patient.mutuelle} />}
            {patient.medecinTraitant && <Row label="Médecin" value={patient.medecinTraitant} />}
          </div>
        </Card>

        {/* ── Allergies ── */}
        <Card
          title={`Allergies${patient.allergies.length > 0 ? ` (${patient.allergies.length})` : ''}`}
          icon={<ShieldAlert className={cn('w-4 h-4', hasCritAllergy ? 'text-red-600' : 'text-orange-500')} />}
          iconBg={hasCritAllergy ? 'bg-red-100' : 'bg-orange-50'}
          onClick={() => onTabChange('infos')}
          urgent={hasCritAllergy}
        >
          {patient.allergies.length === 0 ? (
            <p className="text-sm text-gray-400 py-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Aucune allergie connue
            </p>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              {patient.allergies.map(a => {
                const sev = SEVERITY_CONFIG[a.severite] ?? SEVERITY_CONFIG.LEGERE
                return (
                  <div key={a.id} className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl border',
                    sev.bg, sev.border, sev.pulse && 'animate-pulse',
                  )}>
                    <AlertTriangle className={cn('w-4 h-4 shrink-0', sev.text)} />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-bold', sev.text)}>{a.substance}</p>
                      <p className={cn('text-xs opacity-75', sev.text)}>
                        {SEV_LABEL[a.severite] ?? a.severite}
                        {a.confirmee ? ' · Confirmée' : ' · Non confirmée'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* ── Antécédents ── */}
        <Card
          title={`Antécédents actifs${patient.antecedents.length > 0 ? ` (${patient.antecedents.length})` : ''}`}
          icon={<BookOpen className="w-4 h-4 text-blue-600" />}
          iconBg="bg-blue-50"
          onClick={() => onTabChange('infos')}
        >
          {patient.antecedents.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Aucun antécédent enregistré</p>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              {patient.antecedents.map(ant => {
                const cfg = ANT_TYPE[ant.type] ?? ANT_TYPE.autre
                return (
                  <div key={ant.id} className={cn(
                    'flex items-start gap-2.5 px-3 py-2 rounded-xl border',
                    cfg.color,
                  )}>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold uppercase tracking-wide opacity-70">{cfg.label}</span>
                      <p className="text-sm font-semibold mt-0.5">{ant.description}</p>
                      {ant.dateDebut && (
                        <p className="text-xs opacity-60 mt-0.5">
                          Depuis {new Date(ant.dateDebut).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* ── Dernières constantes ── */}
        {lastConstante && (
          <Card
            title="Dernières constantes"
            icon={<Thermometer className="w-4 h-4 text-teal-600" />}
            iconBg="bg-teal-50"
            onClick={() => onTabChange('constantes')}
          >
            <div className="grid grid-cols-2 gap-x-4">
              {lastConstante.taSystolique && lastConstante.taDiastolique && (
                <Row label="TA" value={`${lastConstante.taSystolique}/${lastConstante.taDiastolique} mmHg`} />
              )}
              {lastConstante.fc          != null && <Row label="FC"      value={`${lastConstante.fc} bpm`} />}
              {lastConstante.spo2        != null && <Row label="SpO₂"    value={`${lastConstante.spo2}%`} />}
              {lastConstante.temperature != null && <Row label="Temp."   value={`${lastConstante.temperature}°C`} />}
              {lastConstante.eva         != null && <Row label="Douleur" value={`EVA ${lastConstante.eva}/10`} />}
              {lastConstante.poids       != null && <Row label="Poids"   value={`${lastConstante.poids} kg`} />}
            </div>
          </Card>
        )}

        {/* ── Bilans ── */}
        {visite && visite.bilans.length > 0 && (
          <Card
            title={`Bilans (${visite.bilans.length})`}
            icon={<FlaskConical className="w-4 h-4 text-violet-600" />}
            iconBg="bg-violet-50"
            onClick={() => onTabChange('bilans')}
            urgent={hasCritBilan}
          >
            <div className="space-y-1.5 pt-1">
              {visite.bilans.slice(0, 5).map(b => (
                <div key={b.id} className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-md shrink-0',
                    b.isCritique && b.resultat ? 'bg-red-100 text-red-700 animate-pulse' :
                    b.statut === 'RESULTAT_DISPONIBLE' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-500',
                  )}>
                    {b.code}
                  </span>
                  <span className="text-sm text-gray-600 flex-1 truncate">{b.libelle}</span>
                  {b.resultat && (
                    <span className={cn('text-sm font-bold shrink-0', b.isCritique ? 'text-red-600' : 'text-gray-700')}>
                      {b.resultat}
                    </span>
                  )}
                </div>
              ))}
              {visite.bilans.length > 5 && (
                <p className="text-xs text-gray-400 pt-1">+{visite.bilans.length - 5} autres</p>
              )}
              {pendingBilans.length > 0 && (
                <p className="text-xs text-amber-600 font-semibold pt-1">
                  {pendingBilans.length} résultat{pendingBilans.length > 1 ? 's' : ''} en attente
                </p>
              )}
            </div>
          </Card>
        )}

        {/* ── Ordonnances ── */}
        {visite && activeOrdo.length > 0 && (
          <Card
            title={`Ordonnances (${activeOrdo.length})`}
            icon={<Pill className="w-4 h-4 text-emerald-600" />}
            iconBg="bg-emerald-50"
            onClick={() => onTabChange('ordonnances')}
          >
            <div className="space-y-2 pt-1">
              {activeOrdo.map(p => (
                <div key={p.id} className="space-y-1">
                  {p.items.slice(0, 3).map((item: any) => (
                    <p key={item.id} className="text-sm text-gray-700">
                      <span className="font-semibold">{item.nomCommercial}</span>
                      {item.dose && <span className="text-gray-500 ml-1">— {item.dose}</span>}
                    </p>
                  ))}
                  {p.items.length > 3 && (
                    <p className="text-xs text-gray-400">+{p.items.length - 3} médicament{p.items.length - 3 > 1 ? 's' : ''}</p>
                  )}
                </div>
              ))}
              {draftOrdo.length > 0 && (
                <p className="text-xs text-amber-600 font-semibold border-t border-gray-50 pt-2">
                  {draftOrdo.length} brouillon{draftOrdo.length > 1 ? 's' : ''} non finalisé{draftOrdo.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </Card>
        )}

        {/* ── SOAP ── */}
        {visite?.consultation && (
          <Card
            title="Note SOAP"
            icon={<Stethoscope className="w-4 h-4 text-blue-600" />}
            iconBg="bg-blue-50"
            onClick={() => onTabChange('soap')}
          >
            <div className="space-y-1.5 pt-1">
              {visite.consultation.assessment && (
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Diagnostic</p>
                  <p className="text-sm text-gray-800 font-medium">{visite.consultation.assessment}</p>
                </div>
              )}
              {visite.consultation.plan && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Plan</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{visite.consultation.plan}</p>
                </div>
              )}
              {visite.consultation.isDraft && (
                <span className="inline-block text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  Brouillon
                </span>
              )}
            </div>
          </Card>
        )}

      </div>
    </div>
  )
}
