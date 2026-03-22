// ──────────────────────────────────────────────────────────────
//  PATCH /api/bilans/[id] — saisir résultat d'un bilan
// ──────────────────────────────────────────────────────────────
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { resultat, isCritique, statut } = await request.json()

  const { data: bilan, error } = await db
    .from('bilans')
    .update({
      resultat:   resultat   ?? null,
      isCritique: isCritique ?? false,
      statut:     statut     ?? (resultat ? 'RESULTAT_DISPONIBLE' : 'EN_ATTENTE_RESULTAT'),
      resultatAt: resultat ? new Date().toISOString() : null,
      updatedAt:  new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(bilan)
}
