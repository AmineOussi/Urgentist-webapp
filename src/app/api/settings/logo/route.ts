// ──────────────────────────────────────────────────────────────
//  POST /api/settings/logo — Upload clinic logo to Supabase Storage
//  Returns { logoUrl }
// ──────────────────────────────────────────────────────────────
import { db }                         from '@/lib/db'
import { NextResponse }               from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { uploadFile, BUCKETS }        from '@/lib/storage'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
const MAX_SIZE      = 2 * 1024 * 1024 // 2 MB

async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const formData = await request.formData()
  const file     = formData.get('logo') as File | null

  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Type de fichier non supporté. Utilisez PNG, JPG ou SVG.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 2 MB).' }, { status: 400 })
  }

  const ext   = file.name.split('.').pop() ?? 'png'
  const bytes = new Uint8Array(await file.arrayBuffer())
  const url   = await uploadFile(BUCKETS.clinicAssets, `logo/logo.${ext}`, bytes, file.type)

  // Persist the logo URL into clinic_settings
  const { data: existing } = await db.from('clinic_settings').select('data').eq('id', 1).maybeSingle()
  const currentData = (existing?.data ?? {}) as Record<string, unknown>
  await db.from('clinic_settings').upsert({
    id:   1,
    data: { ...currentData, logoUrl: url },
    updated_at: new Date().toISOString(),
  })

  return NextResponse.json({ logoUrl: url })
}
