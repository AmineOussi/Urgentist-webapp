// ──────────────────────────────────────────────────────────────
//  POST /api/bilans — prescrire un bilan
// ──────────────────────────────────────────────────────────────
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { visiteId, code, libelle, type } = await request.json()

  if (!visiteId || !code || !libelle) {
    return NextResponse.json({ error: 'visiteId, code et libelle requis' }, { status: 400 })
  }

  const { data: bilan, error } = await db
    .from('bilans')
    .insert({
      visiteId,
      code:    code.trim().toUpperCase(),
      libelle: libelle.trim(),
      type:    type ?? 'biologie',
      statut:  'PRESCRIT',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(bilan, { status: 201 })
}
