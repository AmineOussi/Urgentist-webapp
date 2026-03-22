// ──────────────────────────────────────────────────────────────
//  GET  /api/patients/[id] — dossier patient complet
//  PATCH /api/patients/[id] — mettre à jour les données patient
// ──────────────────────────────────────────────────────────────
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: patient, error } = await db
    .from('patients')
    .select(`
      *,
      allergies (*),
      antecedents (*),
      visites (id, triage, motif, statut, "triageAt")
    `)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })
  return NextResponse.json(patient)
}

// Allowed fields for update (whitelist — never expose id/created_at)
const ALLOWED = ['nom', 'prenom', 'dateNaissance', 'sexe', 'cin', 'telephone', 'groupeSanguin', 'mutuelle', 'medecinTraitant'] as const
type AllowedField = typeof ALLOWED[number]

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 }) }

  // Build safe update object from allowed fields only
  const update: Partial<Record<AllowedField, unknown>> = {}
  for (const field of ALLOWED) {
    if (field in body) update[field] = body[field] === '' ? null : body[field]
  }

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: 'Aucun champ valide fourni' }, { status: 400 })

  const { data, error } = await db
    .from('patients')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
