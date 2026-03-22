// ──────────────────────────────────────────────────────────────
//  POST /api/patients/[id]/allergies — ajouter une allergie
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

  const { substance, severite, confirmee } = await request.json()

  if (!substance?.trim()) {
    return NextResponse.json({ error: 'substance requis' }, { status: 400 })
  }

  const { data, error } = await db
    .from('allergies')
    .insert({
      patientId:  params.id,
      substance:  substance.trim(),
      severite:   severite ?? 'MODEREE',
      confirmee:  confirmee ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
