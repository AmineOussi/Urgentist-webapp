// ──────────────────────────────────────────────────────────────
//  DELETE /api/documents/[id] — remove a patient document
// ──────────────────────────────────────────────────────────────
import { db }                         from '@/lib/db'
import { NextResponse }               from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { deleteFile, BUCKETS }        from '@/lib/storage'

export const dynamic = 'force-dynamic'

async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Fetch document to get storage path
  const { data: doc, error: fetchErr } = await db
    .from('patient_documents')
    .select('url, patientId')
    .eq('id', params.id)
    .single()

  if (fetchErr || !doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  // Extract storage path from URL and delete
  try {
    const urlPath = new URL(doc.url).pathname
    const storagePath = urlPath.split('/patient-docs/')[1]
    if (storagePath) await deleteFile(BUCKETS.patientDocs, storagePath)
  } catch {
    // Storage delete failed — still remove DB record
  }

  const { error } = await db.from('patient_documents').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
