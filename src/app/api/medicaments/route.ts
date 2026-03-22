// ──────────────────────────────────────────────────────────────
//  GET /api/medicaments?q=...   — recherche médicaments
//  Returns up to 10 results ordered by: exact-name-start first,
//  then alphabetical. Used by the ordonnance autocomplete.
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

export async function GET(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json([], { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) return NextResponse.json([])

  // Search nomCommercial and dci, case-insensitive
  const { data, error } = await db
    .from('medicaments')
    .select('id, "nomCommercial", dci, dosage, forme, ppv, "tauxRemboursement", type')
    .eq('actif', true)
    .or(`"nomCommercial".ilike.%${q}%,dci.ilike.%${q}%`)
    .order('"nomCommercial"', { ascending: true })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Reorder: exact-start matches first (client can't do this in Supabase query)
  const ql = q.toLowerCase()
  const sorted = (data ?? []).sort((a, b) => {
    const aStart = a.nomCommercial.toLowerCase().startsWith(ql) ? 0 : 1
    const bStart = b.nomCommercial.toLowerCase().startsWith(ql) ? 0 : 1
    if (aStart !== bStart) return aStart - bStart
    return a.nomCommercial.localeCompare(b.nomCommercial)
  })

  return NextResponse.json(sorted)
}
