// ──────────────────────────────────────────────────────────────
//  GET  /api/settings  — fetch clinic settings
//  PUT  /api/settings  — upsert clinic settings
//
//  Requires SQL table (run once in Supabase):
//  ──────────────────────────────────────────
//  CREATE TABLE IF NOT EXISTS clinic_settings (
//    id   INT PRIMARY KEY DEFAULT 1,
//    data JSONB NOT NULL DEFAULT '{}',
//    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
//  );
//  INSERT INTO clinic_settings (id, data) VALUES (1, '{}')
//    ON CONFLICT (id) DO NOTHING;
// ──────────────────────────────────────────────────────────────
import { db }                         from '@/lib/db'
import { NextResponse }               from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await db
    .from('clinic_settings')
    .select('data')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    // Table might not exist yet — return empty defaults
    return NextResponse.json({
      nom:     '',
      adresse: '',
      telephone: '',
      email:   '',
      doctor:  '',
      rpps:    '',
      logoUrl: null,
    })
  }

  return NextResponse.json(data?.data ?? {})
}

export async function PUT(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()

  const { error } = await db
    .from('clinic_settings')
    .upsert({ id: 1, data: body, updated_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
