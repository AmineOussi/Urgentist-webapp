// ──────────────────────────────────────────────────────────────
//  GET  /api/patients/[id]/documents — list patient documents
//  POST /api/patients/[id]/documents — upload a document
//
//  Requires SQL table (run in Supabase):
//  ──────────────────────────────────────
//  CREATE TABLE IF NOT EXISTS patient_documents (
//    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//    "patientId" UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
//    nom         TEXT NOT NULL,
//    type        TEXT NOT NULL,         -- 'ordonnance'|'radio'|'analyse'|'cr'|'autre'
//    url         TEXT NOT NULL,
//    size        BIGINT,
//    "mimeType"  TEXT,
//    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
//  );
// ──────────────────────────────────────────────────────────────
import { db }                         from '@/lib/db'
import { NextResponse }               from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { uploadFile, BUCKETS }        from '@/lib/storage'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
  'image/gif', 'image/tiff',
]
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── GET — list ────────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await db
    .from('patient_documents')
    .select('*')
    .eq('patientId', params.id)
    .order('createdAt', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// ── POST — upload ─────────────────────────────────────────────
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const formData = await request.formData()
  const file     = formData.get('file') as File | null
  const nom      = (formData.get('nom') as string | null) ?? ''
  const type     = (formData.get('type') as string | null) ?? 'autre'

  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Type non supporté. Utilisez PDF, PNG, JPG.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 20 MB)' }, { status: 400 })
  }

  const ext      = file.name.split('.').pop() ?? 'bin'
  const docId    = crypto.randomUUID()
  const path     = `${params.id}/${docId}.${ext}`
  const bytes    = new Uint8Array(await file.arrayBuffer())
  const url      = await uploadFile(BUCKETS.patientDocs, path, bytes, file.type)

  const docNom   = nom || file.name

  const { data, error } = await db
    .from('patient_documents')
    .insert({
      id:        docId,
      patientId: params.id,
      nom:       docNom,
      type,
      url,
      size:      file.size,
      mimeType:  file.type,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
