// ──────────────────────────────────────────────────────────────
//  PUT /api/visites/[id]/consultation — upsert note SOAP
// ──────────────────────────────────────────────────────────────
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { subjectif, objectif, assessment, plan } = await request.json()

  // Check if consultation exists for this visite
  const { data: existing } = await db
    .from('consultations')
    .select('id')
    .eq('visiteId', params.id)
    .single()

  if (existing) {
    // Update
    const { data, error } = await db
      .from('consultations')
      .update({
        subjectif: subjectif ?? null,
        objectif:  objectif  ?? null,
        assessment: assessment ?? null,
        plan:       plan       ?? null,
        updatedAt:  new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } else {
    // Get DB user
    const { data: dbUser } = await db
      .from('users')
      .select('id')
      .eq('supabaseId', user.id)
      .single()

    const { data, error } = await db
      .from('consultations')
      .insert({
        visiteId:   params.id,
        medecinId:  dbUser?.id ?? null,
        subjectif:  subjectif ?? null,
        objectif:   objectif  ?? null,
        assessment: assessment ?? null,
        plan:       plan       ?? null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }
}
