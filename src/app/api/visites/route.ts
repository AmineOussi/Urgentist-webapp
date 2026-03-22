// ──────────────────────────────────────────────────────────────
//  GET  /api/visites  — salle d'attente (EN_ATTENTE + EN_COURS)
//  POST /api/visites  — créer une nouvelle visite
// ──────────────────────────────────────────────────────────────
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: visites, error } = await db
    .from('visites')
    .select(`
      *,
      patient:patients!patientId (id, nom, prenom, "dateNaissance", sexe, cin),
      box:boxes!boxId (nom),
      constantes_vitales (
        "taSystolique", "taDiastolique", fc, spo2, eva, "releveAt"
      )
    `)
    .in('statut', ['EN_ATTENTE', 'EN_COURS'])
    .order('triage', { ascending: true })
    .order('triageAt', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ visites })
}

export async function POST(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { cin, motif, triage, boxId } = body

  if (!cin || !triage) {
    return NextResponse.json({ error: 'CIN et triage requis' }, { status: 400 })
  }

  const { data: patient } = await db
    .from('patients')
    .select('id')
    .eq('cin', cin.trim().toUpperCase())
    .single()

  if (!patient) {
    return NextResponse.json({ error: `Patient avec CIN "${cin}" introuvable` }, { status: 404 })
  }

  const { data: visite, error } = await db
    .from('visites')
    .insert({
      patientId: patient.id,
      triage,
      motif:  motif?.trim() || null,
      statut: 'EN_ATTENTE',
      boxId:  boxId ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(visite, { status: 201 })
}
