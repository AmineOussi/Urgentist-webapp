import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import PatientView from '@/components/patient/PatientView'

// Patient data changes frequently (vitals, prescriptions) — always render fresh
export const dynamic = 'force-dynamic'

interface Props {
  params:       { id: string }
  searchParams: { visite?: string }
}

export default async function PatientPage({ params, searchParams }: Props) {
  const { data: patient } = await db
    .from('patients')
    .select(`*, allergies (*), antecedents (*), visites (id, triage, motif, statut, "triageAt")`)
    .eq('id', params.id)
    .single()

  if (!patient) notFound()

  const allergies = (patient.allergies ?? []).sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const antecedents = (patient.antecedents ?? [])
    .filter((a: any) => a.actif)
    .sort((a: any, b: any) => new Date(b.dateDebut ?? 0).getTime() - new Date(a.dateDebut ?? 0).getTime())
  const visites = (patient.visites ?? [])
    .sort((a: any, b: any) => new Date(b.triageAt).getTime() - new Date(a.triageAt).getTime())
    .slice(0, 10)

  const visiteId = searchParams.visite ?? visites.find(
    (v: any) => v.statut === 'EN_ATTENTE' || v.statut === 'EN_COURS'
  )?.id

  let visiteData = null
  if (visiteId) {
    const { data } = await db
      .from('visites')
      .select(`
        *,
        box:boxes!boxId (nom),
        constantes_vitales (*),
        consultations (*),
        bilans (*),
        prescriptions (
          *,
          prescription_items (
            *,
            medicament:medicaments!medicamentId ("nomCommercial", dci)
          )
        )
      `)
      .eq('id', visiteId)
      .single()

    if (data) {
      // Normalise Supabase shape → PatientView shape (camelCase + flat)
      visiteData = {
        ...data,
        // constantes_vitales → constantesVitales (sorted asc)
        constantesVitales: (data.constantes_vitales ?? []).sort(
          (a: any, b: any) => new Date(a.releveAt).getTime() - new Date(b.releveAt).getTime()
        ),
        // consultations[] → consultation (first or null)
        consultation: data.consultations?.[0] ?? null,
        // flatten prescription_items → items, flatten medicament fields
        prescriptions: (data.prescriptions ?? []).map((p: any) => ({
          ...p,
          items: (p.prescription_items ?? []).map((item: any) => ({
            ...item,
            nomCommercial: item.medicament?.nomCommercial ?? '',
            dci:           item.medicament?.dci           ?? '',
          })),
        })),
      }
    }
  }

  const patientData = { ...patient, allergies, antecedents, visites }

  return <PatientView patient={patientData} visite={visiteData} />
}
