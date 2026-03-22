/**
 * storage.ts
 * ──────────
 * Supabase Storage helpers.
 * Uses the service-role db client so uploads always succeed.
 *
 * Buckets used:
 *   - prescriptions   (PDFs)            — public
 *   - patient-docs    (scans, images)    — public
 *   - clinic-assets   (logo, etc.)       — public
 */

import { db } from '@/lib/db'

export const BUCKETS = {
  prescriptions:  'prescriptions',
  patientDocs:    'patient-docs',
  clinicAssets:   'clinic-assets',
} as const

// ── Ensure buckets exist (call once at startup / on-demand) ───
export async function ensureBucket(
  name: string,
  options: { public?: boolean; fileSizeLimit?: number } = {},
) {
  const { data: list } = await db.storage.listBuckets()
  if (list?.find(b => b.name === name)) return // already exists

  await db.storage.createBucket(name, {
    public:       options.public        ?? true,
    fileSizeLimit: options.fileSizeLimit ?? 20 * 1024 * 1024, // 20 MB default
  })
}

// ── Upload bytes ──────────────────────────────────────────────
export async function uploadFile(
  bucket:      string,
  path:        string,
  data:        Uint8Array | Blob | Buffer,
  contentType: string,
): Promise<string> {
  await ensureBucket(bucket, { public: true })

  const { error } = await db.storage.from(bucket).upload(path, data, {
    contentType,
    upsert: true,
  })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data: { publicUrl } } = db.storage.from(bucket).getPublicUrl(path)
  return publicUrl
}

// ── Delete file ───────────────────────────────────────────────
export async function deleteFile(bucket: string, path: string): Promise<void> {
  await db.storage.from(bucket).remove([path])
}

// ── Get signed URL (for private buckets) ─────────────────────
export async function getSignedUrl(
  bucket: string,
  path:   string,
  expiresIn = 3600,
): Promise<string> {
  const { data, error } = await db.storage.from(bucket).createSignedUrl(path, expiresIn)
  if (error || !data?.signedUrl) throw new Error('Could not create signed URL')
  return data.signedUrl
}
