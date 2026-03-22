// ──────────────────────────────────────────────────────────────
//  GET /api/prescriptions/[id] — fetch single prescription
// ──────────────────────────────────────────────────────────────
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
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

  const { data, error } = await db
    .from('prescriptions')
    .select(`
      *,
      visite:visites (
        id,
        createdAt,
        patient:patients ( nom, prenom, "dateNaissance", cin, telephone )
      ),
      items:prescription_items (
        id, dose, frequence, duree, voie, instructions,
        medicament:medicaments!medicamentId ( "nomCommercial", dci, dosage, forme )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })

  return NextResponse.json(data)
}
