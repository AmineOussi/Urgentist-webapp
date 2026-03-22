// ──────────────────────────────────────────────────────────────
//  POST /api/prescriptions — créer une ordonnance
// ──────────────────────────────────────────────────────────────
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

interface PrescItem {
  medicamentId: string
  dose:         string | null
  frequence:    string | null
  duree:        string | null
  voie:         string | null
  instructions: string | null
}

export async function POST(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { visiteId, isDraft, items }: { visiteId: string; isDraft?: boolean; items: PrescItem[] } = await request.json()

  if (!visiteId || !items?.length) {
    return NextResponse.json({ error: 'visiteId et items requis' }, { status: 400 })
  }

  // Create prescription
  const { data: prescription, error: pErr } = await db
    .from('prescriptions')
    .insert({ visiteId, isDraft: isDraft ?? false })
    .select()
    .single()

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  // Create items
  const { error: iErr } = await db
    .from('prescription_items')
    .insert(
      items.map(item => ({
        prescriptionId: prescription.id,
        medicamentId:   item.medicamentId,
        dose:           item.dose         ?? null,
        frequence:      item.frequence    ?? null,
        duree:          item.duree        ?? null,
        voie:           item.voie         ?? null,
        instructions:   item.instructions ?? null,
      }))
    )

  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 })

  // Return with items
  const { data: result } = await db
    .from('prescriptions')
    .select(`*, prescription_items (*, medicament:medicaments!medicamentId ("nomCommercial", dci))`)
    .eq('id', prescription.id)
    .single()

  return NextResponse.json(result, { status: 201 })
}
