import { db } from '@/lib/db'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Emergency dashboard must always show live data, never a stale cached snapshot
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { TriageBadge, StatutBadge } from '@/components/ui/badge'
import { WaitTimer } from '@/components/dashboard/WaitTimer'
import NouvelleVisiteButton from '@/components/ui/NouvelleVisiteButton'
import { age } from '@/lib/utils'
import {
  Clock, Users, Activity, Bed,
  ChevronRight, AlertCircle,
} from 'lucide-react'


export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: visites } = await db
    .from('visites')
    .select(`
      id, triage, motif, statut, "triageAt", boxId,
      patient:patients!patientId (id, nom, prenom, "dateNaissance", sexe),
      box:boxes!boxId (nom),
      constantes_vitales ("taSystolique","taDiastolique", fc, spo2, eva, "releveAt")
    `)
    .in('statut', ['EN_ATTENTE', 'EN_COURS'])
    .order('triage', { ascending: true })
    .order('triageAt', { ascending: true })

  const rows = (visites ?? []).map((v: any) => ({
    ...v,
    cv: (v.constantes_vitales ?? []).sort(
      (a: any, b: any) => new Date(b.releveAt).getTime() - new Date(a.releveAt).getTime()
    )[0] ?? null,
  }))

  const enAttente = rows.filter((v: any) => v.statut === 'EN_ATTENTE')
  const enCours   = rows.filter((v: any) => v.statut === 'EN_COURS')
  const critiques = rows.filter((v: any) => v.triage === 'P1' || v.triage === 'P2')

  return (
    <div className="min-h-full">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 px-5 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Salle d&apos;attente</h1>
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">Urgences — mise à jour toutes les 30 s</p>
        </div>
        <NouvelleVisiteButton />
      </header>

      <div className="px-5 md:px-8 py-6 space-y-6">

        {/* ── KPI Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Users className="w-5 h-5" />}
            color="blue"
            label="Patients actifs"
            value={rows.length}
          />
          <KpiCard
            icon={<Clock className="w-5 h-5" />}
            color="orange"
            label="En attente"
            value={enAttente.length}
          />
          <KpiCard
            icon={<Activity className="w-5 h-5" />}
            color="green"
            label="En cours de PEC"
            value={enCours.length}
          />
          <KpiCard
            icon={<AlertCircle className="w-5 h-5" />}
            color="red"
            label="Critiques (P1/P2)"
            value={critiques.length}
          />
        </div>

        {/* ── Table ─────────────────────────────────────────────── */}
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Triage</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Motif</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Box</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Constantes</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Attente</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((v: any) => (
                    <PatientRow key={v.id} visite={v} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {rows.map((v: any) => (
                <MobilePatientCard key={v.id} visite={v} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────
const kpiColors: Record<string, string> = {
  blue:   'bg-blue-50   text-blue-600',
  orange: 'bg-orange-50 text-orange-600',
  green:  'bg-emerald-50 text-emerald-600',
  red:    'bg-red-50    text-red-600',
}

function KpiCard({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpiColors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1 leading-tight">{label}</p>
      </div>
    </div>
  )
}

// ── Desktop row ───────────────────────────────────────────────
function PatientRow({ visite: v }: { visite: any }) {
  const a = age(v.patient?.dateNaissance)
  const cv = v.cv

  return (
    <tr className="hover:bg-blue-50/20 transition-colors group">
      <td className="px-5 py-3.5">
        <TriageBadge triage={v.triage} />
      </td>
      <td className="px-5 py-3.5">
        <p className="font-semibold text-gray-900 leading-tight">
          {v.patient?.nom} {v.patient?.prenom}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {v.patient?.sexe === 'M' ? 'Homme' : 'Femme'}{a ? ` · ${a} ans` : ''}
        </p>
      </td>
      <td className="px-5 py-3.5 text-gray-600 max-w-[160px] truncate">{v.motif ?? '—'}</td>
      <td className="px-5 py-3.5">
        {v.box?.nom
          ? <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">{v.box.nom}</span>
          : <span className="text-gray-300">—</span>
        }
      </td>
      <td className="px-5 py-3.5">
        {cv ? (
          <div className="flex flex-wrap gap-1">
            {cv.taSystolique && (
              <span className="text-[11px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-md font-mono font-medium">
                {cv.taSystolique}/{cv.taDiastolique}
              </span>
            )}
            {cv.fc && (
              <span className="text-[11px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md font-mono font-medium">
                {cv.fc} bpm
              </span>
            )}
            {cv.spo2 && (
              <span className="text-[11px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-mono font-medium">
                {cv.spo2}%
              </span>
            )}
            {cv.eva != null && (
              <span className="text-[11px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-md font-mono font-medium">
                EVA {cv.eva}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-300 italic">Non renseignées</span>
        )}
      </td>
      <td className="px-5 py-3.5">
        <WaitTimer from={v.triageAt} triage={v.triage} />
      </td>
      <td className="px-5 py-3.5">
        <StatutBadge statut={v.statut} />
      </td>
      <td className="px-5 py-3.5">
        <Link
          href={`/patients/${v.patient?.id}?visite=${v.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50
            hover:bg-brand-100 rounded-xl transition-colors group-hover:shadow-sm"
        >
          Ouvrir <ChevronRight className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  )
}

// ── Mobile card ───────────────────────────────────────────────
function MobilePatientCard({ visite: v }: { visite: any }) {
  const a = age(v.patient?.dateNaissance)

  return (
    <Link
      href={`/patients/${v.patient?.id}?visite=${v.id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-card p-4 active:scale-[.99] transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <TriageBadge triage={v.triage} />
            <StatutBadge statut={v.statut} />
          </div>
          <p className="font-semibold text-gray-900 mt-2 leading-tight">
            {v.patient?.nom} {v.patient?.prenom}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {v.patient?.sexe === 'M' ? 'Homme' : 'Femme'}{a ? ` · ${a} ans` : ''}
          </p>
          <p className="text-sm text-gray-600 mt-1 truncate">{v.motif}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <WaitTimer from={v.triageAt} triage={v.triage} />
          {v.box?.nom && (
            <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">{v.box.nom}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Empty state ───────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
        <Bed className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">Aucun patient en attente</h3>
      <p className="text-sm text-gray-400 max-w-xs">
        Les patients admis aux urgences apparaîtront ici en temps réel.
      </p>
    </div>
  )
}
