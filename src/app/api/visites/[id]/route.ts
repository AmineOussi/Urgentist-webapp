// ──────────────────────────────────────────────────────────────
//  GET   /api/visites/[id]   — détail visite
//  PATCH /api/visites/[id]   — mettre à jour statut / box / orientation
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

  const { data: visite, error } = await db
    .from('visites')
    .select(`
      *,
      patient:patients!patientId (*),
      box:boxes!boxId (*),
      constantes_vitales (*),
      consultation:consultations (*),
      bilans (*),
      prescriptions (
        *,
        prescription_items (
          *,
          medicament:medicaments!medicamentId ("nomCommercial", dci)
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: 'Visite introuvable' }, { status: 404 })

  // consultations is returned as array by Supabase — flatten to single object
  const consultation = Array.isArray(visite.consultation)
    ? visite.consultation[0] ?? null
    : visite.consultation ?? null

  return NextResponse.json({ ...visite, consultation })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, any> = {}
  if (body.statut      !== undefined) updates.statut      = body.statut
  if (body.boxId       !== undefined) updates.boxId       = body.boxId
  if (body.orientation !== undefined) updates.orientation = body.orientation
  if (body.diagnostic  !== undefined) updates.diagnosticPrincipal = body.diagnostic
  if (body.statut === 'EN_COURS')     updates.prisEnChargeAt = new Date().toISOString()
  if (body.statut === 'TERMINE')      updates.termineeAt     = new Date().toISOString()

  const { data: visite, error } = await db
    .from('visites')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(visite)
}
