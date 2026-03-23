// ──────────────────────────────────────────────────────────────
//  GET /api/patients/[id]/historique
//  Returns a full chronological timeline of all patient activity:
//  visites + nested constantes, SOAP, bilans, prescriptions, docs
// ──────────────────────────────────────────────────────────────
import { db }                         from '@/lib/db'
import { NextResponse }               from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const patientId = params.id

  // Fetch all visites with full nested data in parallel with documents
  const [visiteRes, docRes, patRes] = await Promise.all([
    db
      .from('visites')
      .select(`
        id, triage, motif, statut, orientation, "triageAt", "updatedAt",
        box:boxes!boxId (nom),
        constantes_vitales (
          id, "releveAt",
          "taSystolique", "taDiastolique", fc, spo2, temperature, eva, poids, fr, glycemie
        ),
        consultations (
          id, subjectif, objectif, assessment, plan, isDraft, "updatedAt"
        ),
        bilans (
          id, code, libelle, type, statut, resultat, "isCritique", "prescritAt", "resultatAt"
        ),
        prescriptions (
          id, "createdAt", "isDraft",
          prescription_items (
            id, dose, frequence, duree, voie,
            medicament:medicaments!medicamentId ("nomCommercial", dci)
          )
        )
      `)
      .eq('patientId', patientId)
      .order('triageAt', { ascending: false }),

    db
      .from('patient_documents')
      .select('id, name, type, fileUrl, "uploadedAt"')
      .eq('patientId', patientId)
      .order('uploadedAt', { ascending: false }),

    db
      .from('patients')
      .select('createdAt')
      .eq('id', patientId)
      .single(),
  ])

  if (visiteRes.error)
    return NextResponse.json({ error: visiteRes.error.message }, { status: 500 })

  return NextResponse.json({
    createdAt: patRes.data?.createdAt ?? null,
    visites:   visiteRes.data ?? [],
    documents: docRes.data   ?? [],
  })
}
