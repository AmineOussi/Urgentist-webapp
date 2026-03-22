// ──────────────────────────────────────────────────────────────
//  POST /api/constantes — enregistrer un relevé de constantes
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

  const body = await request.json()
  const { visiteId, taSystolique, taDiastolique, fc, fr, spo2, temperature, glycemie, eva, poids } = body

  if (!visiteId) {
    return NextResponse.json({ error: 'visiteId requis' }, { status: 400 })
  }

  const { data: constante, error } = await db
    .from('constantes_vitales')
    .insert({
      visiteId,
      releveAt:      new Date().toISOString(),
      taSystolique:  taSystolique  ?? null,
      taDiastolique: taDiastolique ?? null,
      fc:            fc            ?? null,
      fr:            fr            ?? null,
      spo2:          spo2          ?? null,
      temperature:   temperature   ?? null,
      glycemie:      glycemie      ?? null,
      eva:           eva           ?? null,
      poids:         poids         ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(constante, { status: 201 })
}
