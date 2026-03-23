'use client'

// ──────────────────────────────────────────────────────────────
//  HistoriqueTab — Full patient timeline
//  Shows every action ever recorded: visites, constantes, SOAP,
//  bilans, prescriptions, documents — in reverse chronological order
// ──────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Activity, AlertTriangle, Stethoscope, FlaskConical,
  Pill, FileText, UserPlus, ChevronDown, ChevronUp,
  Clock, CheckCircle2, XCircle, Thermometer, Heart,
  TrendingUp, FolderOpen, Loader2,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
interface Constante {
  id: string; releveAt: string
  taSystolique: number | null; taDiastolique: number | null
  fc: number | null; spo2: number | null; temperature: number | null
  eva: number | null; poids: number | null
}
interface Consultation {
  id: string; subjectif: string | null; objectif: string | null
  assessment: string | null; plan: string | null
  isDraft: boolean; updatedAt: string
}
interface Bilan {
  id: string; code: string; libelle: string; type: string
  statut: string; resultat: string | null; isCritique: boolean
  prescritAt: string; resultatAt: string | null
}
interface PrescItem {
  id: string; dose: string | null; frequence: string | null; duree: string | null; voie: string | null
  medicament: { nomCommercial: string; dci: string } | null
}
interface Prescription {
  id: string; createdAt: string; isDraft: boolean
  prescription_items: PrescItem[]
}
interface Visite {
  id: string; triage: string; motif: string | null; statut: string
  orientation: string | null; triageAt: string; updatedAt: string
  box: { nom: string } | null
  constantes_vitales: Constante[]
  consultations:      Consultation[]
  bilans:             Bilan[]
  prescriptions:      Prescription[]
}
interface Document {
  id: string; name: string; type: string; fileUrl: string; uploadedAt: string
}

// ── Config ─────────────────────────────────────────────────────
const TRIAGE_COLOR: Record<string, string> = {
  P1: 'bg-red-500',
  P2: 'bg-orange-500',
  P3: 'bg-yellow-400',
  P4: 'bg-green-500',
}
const STATUT_LABEL: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  EN_ATTENTE: { label: 'En attente',  icon: <Clock        className="w-3 h-3" />, color: 'text-amber-600 bg-amber-50' },
  EN_COURS:   { label: 'En cours',    icon: <Activity     className="w-3 h-3" />, color: 'text-blue-600  bg-blue-50'  },
  TERMINE:    { label: 'Clôturé',     icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-gray-600  bg-gray-100' },
  TRANSFERE:  { label: 'Transféré',   icon: <XCircle      className="w-3 h-3" />, color: 'text-purple-600 bg-purple-50' },
}
const ORIENTATION_LABEL: Record<string, string> = {
  DOMICILE:        'Retour à domicile',
  HOSPITALISATION: 'Hospitalisé',
  TRANSFERT:       'Transféré',
  DECES:           'Décès',
  FUGUE:           'Fugue / AMA',
}
const DOC_TYPE_LABEL: Record<string, string> = {
  radio:       'Radiologie',
  analyse:     'Analyse',
  cr:          'Compte-rendu',
  ordonnance:  'Ordonnance',
  autre:       'Document',
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
function fmtTime(date: string) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function fmtFull(date: string) {
  return `${fmt(date)} à ${fmtTime(date)}`
}

// ── Constantes summary ────────────────────────────────────────
function ConstanteSummary({ c }: { c: Constante }) {
  const items = [
    c.taSystolique && c.taDiastolique ? `TA ${c.taSystolique}/${c.taDiastolique}` : null,
    c.fc    != null ? `FC ${c.fc} bpm` : null,
    c.spo2  != null ? `SpO₂ ${c.spo2}%`  : null,
    c.temperature != null ? `T° ${c.temperature}°C` : null,
    c.eva   != null ? `EVA ${c.eva}/10`  : null,
    c.poids != null ? `${c.poids} kg`    : null,
  ].filter(Boolean)

  return (
    <div className="flex items-start gap-2.5 py-2 px-3 bg-gray-50 rounded-xl">
      <Thermometer className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Constantes · {fmtFull(c.releveAt)}
        </p>
        <p className="text-xs text-gray-700 flex flex-wrap gap-x-3 gap-y-0.5">
          {items.length > 0 ? items.join(' · ') : '—'}
        </p>
      </div>
    </div>
  )
}

// ── Visite card ───────────────────────────────────────────────
function VisiteCard({ visite }: { visite: Visite }) {
  const [open, setOpen] = useState(true)
  const tc  = TRIAGE_COLOR[visite.triage] ?? 'bg-gray-400'
  const sc  = STATUT_LABEL[visite.statut] ?? STATUT_LABEL.EN_ATTENTE
  const hasCritique = (visite.bilans ?? []).some(b => b.isCritique && b.resultat)

  const totalActions =
    (visite.constantes_vitales ?? []).length +
    (visite.consultations ?? []).length +
    (visite.bilans ?? []).length +
    (visite.prescriptions ?? []).length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Visite header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50/60 transition-colors"
      >
        {/* Triage dot */}
        <div className={cn('w-3 h-3 rounded-full shrink-0', tc,
          visite.triage === 'P1' && 'animate-pulse ring-2 ring-red-300 ring-offset-1'
        )} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900">{fmt(visite.triageAt)}</span>
            <span className="text-xs text-gray-400">{fmtTime(visite.triageAt)}</span>
            <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', sc.color)}>
              {sc.icon} {sc.label}
            </span>
            {hasCritique && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full animate-pulse">
                <AlertTriangle className="w-2.5 h-2.5" /> Critique
              </span>
            )}
            {visite.triage && (
              <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-lg text-white', tc)}>
                {visite.triage}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {visite.motif && <p className="text-xs text-gray-500 truncate max-w-xs">{visite.motif}</p>}
            {visite.box   && <span className="text-[10px] text-brand-600 font-semibold bg-brand-50 px-1.5 py-0.5 rounded-md">{visite.box.nom}</span>}
            {visite.orientation && (
              <span className="text-[10px] text-gray-500">→ {ORIENTATION_LABEL[visite.orientation] ?? visite.orientation}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {totalActions > 0 && (
            <span className="text-[10px] text-gray-400">{totalActions} action{totalActions > 1 ? 's' : ''}</span>
          )}
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      {/* Visite body */}
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-50 pt-3">

          {/* Constantes */}
          {(visite.constantes_vitales ?? []).length > 0 && (
            <div className="space-y-1.5">
              {(visite.constantes_vitales ?? [])
                .sort((a, b) => new Date(a.releveAt).getTime() - new Date(b.releveAt).getTime())
                .map(c => <ConstanteSummary key={c.id} c={c} />)}
            </div>
          )}

          {/* SOAP consultation */}
          {(visite.consultations ?? []).map(cons => (
            <div key={cons.id} className="flex items-start gap-2.5 py-2 px-3 bg-blue-50/60 rounded-xl">
              <Stethoscope className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Note SOAP · {fmtFull(cons.updatedAt)}
                  {cons.isDraft && <span className="ml-1.5 text-amber-600">· Brouillon</span>}
                </p>
                <div className="space-y-1">
                  {cons.assessment && (
                    <p className="text-xs text-gray-700">
                      <span className="font-semibold text-blue-700">Diagnostic : </span>{cons.assessment}
                    </p>
                  )}
                  {cons.plan && (
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Plan : </span>{cons.plan}
                    </p>
                  )}
                  {cons.subjectif && !cons.assessment && (
                    <p className="text-xs text-gray-600 line-clamp-2">{cons.subjectif}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Bilans */}
          {(visite.bilans ?? []).length > 0 && (
            <div className="flex items-start gap-2.5 py-2 px-3 bg-violet-50/60 rounded-xl">
              <FlaskConical className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Bilans ({(visite.bilans ?? []).length})
                </p>
                <div className="space-y-1">
                  {(visite.bilans ?? []).map(b => (
                    <div key={b.id} className="flex items-center gap-2">
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                        b.isCritique && b.resultat ? 'bg-red-100 text-red-700 animate-pulse' :
                        b.statut === 'RESULTAT_DISPONIBLE' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500',
                      )}>
                        {b.code}
                      </span>
                      <span className="text-xs text-gray-600 flex-1 truncate">{b.libelle}</span>
                      {b.resultat && (
                        <span className={cn('text-xs font-semibold', b.isCritique ? 'text-red-600' : 'text-gray-700')}>
                          {b.resultat}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Prescriptions */}
          {(visite.prescriptions ?? []).filter(p => !p.isDraft).map(presc => (
            <div key={presc.id} className="flex items-start gap-2.5 py-2 px-3 bg-emerald-50/60 rounded-xl">
              <Pill className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Ordonnance · {fmtFull(presc.createdAt)}
                </p>
                <div className="space-y-0.5">
                  {presc.prescription_items.map(item => (
                    <p key={item.id} className="text-xs text-gray-700">
                      <span className="font-semibold">{item.medicament?.nomCommercial ?? '—'}</span>
                      {[item.dose, item.frequence, item.duree].filter(Boolean).join(' · ') && (
                        <span className="text-gray-500 ml-1">
                          — {[item.dose, item.frequence, item.duree].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {totalActions === 0 && (
            <p className="text-xs text-gray-400 italic text-center py-2">Aucune action enregistrée pour cette visite</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Timeline entry wrapper ─────────────────────────────────────
function TimelineEntry({
  dot, children,
}: {
  dot: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="relative flex gap-4">
      {/* Vertical line */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-200 shrink-0 z-10">
          {dot}
        </div>
        <div className="w-0.5 bg-gray-100 flex-1 mt-1" />
      </div>
      <div className="flex-1 pb-6 min-w-0">{children}</div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
interface Props {
  patientId:        string
  patientCreatedAt: string | null
}

export default function HistoriqueTab({ patientId, patientCreatedAt }: Props) {
  const [data,    setData]    = useState<{ visites: Visite[]; documents: Document[]; createdAt: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/patients/${patientId}/historique`)
      .then(r => r.json())
      .then(json => { setData(json); setLoading(false) })
      .catch(() => { setError('Erreur de chargement'); setLoading(false) })
  }, [patientId])

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Chargement de l&apos;historique…</span>
    </div>
  )

  if (error) return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
      <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
    </div>
  )

  if (!data) return null

  const { visites, documents } = data
  const createdAt = data.createdAt ?? patientCreatedAt

  // Attach documents to the nearest visite by date, or float them separately
  const floatingDocs = documents.filter(doc => {
    const docDate = new Date(doc.uploadedAt).getTime()
    return !visites.some(v => {
      const vDate = new Date(v.triageAt).getTime()
      const vEnd  = new Date(v.updatedAt).getTime()
      return docDate >= vDate && docDate <= vEnd + 24 * 3600 * 1000
    })
  })

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-4 h-4 text-brand-600" />
        <h2 className="text-sm font-bold text-gray-900">Historique du dossier</h2>
        <span className="text-xs text-gray-400">
          {visites.length} visite{visites.length !== 1 ? 's' : ''}
          {documents.length > 0 ? ` · ${documents.length} document${documents.length !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      {visites.length === 0 && documents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center py-16 gap-3">
          <Clock className="w-10 h-10 text-gray-200" />
          <p className="text-sm text-gray-400">Aucune activité enregistrée</p>
        </div>
      ) : (
        <div className="space-y-0">
          {/* Visites timeline */}
          {visites.map((v, i) => (
            <TimelineEntry
              key={v.id}
              dot={
                <div className={cn('w-3 h-3 rounded-full', TRIAGE_COLOR[v.triage] ?? 'bg-gray-400',
                  v.triage === 'P1' && 'animate-pulse',
                )} />
              }
            >
              <VisiteCard visite={v} />

              {/* Documents uploaded during this visite */}
              {documents
                .filter(doc => {
                  const docDate = new Date(doc.uploadedAt).getTime()
                  const vDate   = new Date(v.triageAt).getTime()
                  const vEnd    = new Date(v.updatedAt).getTime()
                  return docDate >= vDate && docDate <= vEnd + 24 * 3600 * 1000
                })
                .map(doc => (
                  <div key={doc.id} className="mt-2 flex items-center gap-2.5 px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <FolderOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{doc.name}</p>
                      <p className="text-[10px] text-gray-400">{DOC_TYPE_LABEL[doc.type] ?? doc.type} · {fmtFull(doc.uploadedAt)}</p>
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] font-semibold text-brand-600 hover:underline shrink-0">
                      Ouvrir
                    </a>
                  </div>
                ))}
            </TimelineEntry>
          ))}

          {/* Floating documents (not tied to a visite) */}
          {floatingDocs.map(doc => (
            <TimelineEntry
              key={doc.id}
              dot={<FolderOpen className="w-3.5 h-3.5 text-gray-400" />}
            >
              <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{doc.name}</p>
                  <p className="text-[10px] text-gray-400">{DOC_TYPE_LABEL[doc.type] ?? doc.type} · {fmtFull(doc.uploadedAt)}</p>
                </div>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] font-semibold text-brand-600 hover:underline">
                  Ouvrir
                </a>
              </div>
            </TimelineEntry>
          ))}

          {/* Patient created */}
          {createdAt && (
            <div className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 shrink-0 z-10">
                  <UserPlus className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="flex-1 pb-2">
                <div className="bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3">
                  <p className="text-xs font-semibold text-brand-700">Dossier patient créé</p>
                  <p className="text-[11px] text-brand-500 mt-0.5">{fmtFull(createdAt)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
