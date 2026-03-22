// ──────────────────────────────────────────────────────────────
//  POST /api/patients/[id]/antecedents — ajouter un antécédent
// ──────────────────────────────────────────────────────────────
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { type, description, dateDebut, actif } = await request.json()

  if (!description?.trim()) {
    return NextResponse.json({ error: 'description requis' }, { status: 400 })
  }

  const { data, error } = await db
    .from('antecedents')
    .insert({
      patientId:   params.id,
      type:        type ?? 'MEDICAL',
      description: description.trim(),
      dateDebut:   dateDebut || null,
      actif:       actif ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
