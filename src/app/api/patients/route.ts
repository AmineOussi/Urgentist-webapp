// POST /api/patients — créer un patient
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
  const { cin, nom, prenom, dateNaissance, sexe, telephone, telephoneUrgence,
    contactUrgence, email, adresse, ville, groupeSanguin, mutuelle, medecinTraitant } = body

  if (!nom || !prenom || !sexe) {
    return NextResponse.json({ error: 'Nom, prénom et sexe requis' }, { status: 400 })
  }

  const { data: patient, error } = await db
    .from('patients')
    .insert({
      cin:              cin?.trim().toUpperCase() || null,
      nom:              nom.trim(),
      prenom:           prenom.trim(),
      dateNaissance:    dateNaissance || null,
      sexe,
      telephone:        telephone || null,
      telephoneUrgence: telephoneUrgence || null,
      contactUrgence:   contactUrgence || null,
      email:            email || null,
      adresse:          adresse || null,
      ville:            ville || null,
      groupeSanguin:    groupeSanguin || null,
      mutuelle:         mutuelle || null,
      medecinTraitant:  medecinTraitant || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Un patient avec ce CIN existe déjà' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(patient, { status: 201 })
}
