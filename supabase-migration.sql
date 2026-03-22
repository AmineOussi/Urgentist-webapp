-- ================================================================
--  USS-I — Supabase Migration  (fixed)
--  Run this in Supabase Dashboard → SQL Editor
--  Safe to run multiple times (fully idempotent)
-- ================================================================

-- ── 1. Clinic settings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clinic_settings (
  id          INT          PRIMARY KEY DEFAULT 1,
  data        JSONB        NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO clinic_settings (id, data)
VALUES (1, '{}')
ON CONFLICT (id) DO NOTHING;

-- ── 2. Patient documents ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_documents (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId"  UUID         NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  nom          TEXT         NOT NULL,
  type         TEXT         NOT NULL DEFAULT 'autre',
  url          TEXT         NOT NULL,
  size         BIGINT,
  "mimeType"   TEXT,
  "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_documents_patient
  ON patient_documents ("patientId");

-- ── 3. Storage buckets ─────────────────────────────────────────
--  public = true so generated URLs are accessible without auth
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('prescriptions', 'prescriptions', true, 20971520, ARRAY['application/pdf']),
  ('patient-docs',  'patient-docs',  true, 20971520, ARRAY[
      'application/pdf',
      'image/png','image/jpeg','image/jpg',
      'image/webp','image/gif','image/tiff'
  ]),
  ('clinic-assets', 'clinic-assets', true, 2097152, ARRAY[
      'image/png','image/jpeg','image/jpg',
      'image/webp','image/svg+xml'
  ])
ON CONFLICT (id) DO NOTHING;

-- ── 4. Table RLS ───────────────────────────────────────────────
ALTER TABLE clinic_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_settings_authenticated" ON clinic_settings;
CREATE POLICY "clinic_settings_authenticated"
  ON clinic_settings FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "patient_documents_authenticated" ON patient_documents;
CREATE POLICY "patient_documents_authenticated"
  ON patient_documents FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- ── 5. Storage RLS (correct syntax: policies on storage.objects)
-- ──────────────────────────────────────────────────────────────

-- ── prescriptions bucket ──────────────────────────────────────
DROP POLICY IF EXISTS "prescriptions_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "prescriptions_auth_insert"  ON storage.objects;
DROP POLICY IF EXISTS "prescriptions_auth_update"  ON storage.objects;
DROP POLICY IF EXISTS "prescriptions_auth_delete"  ON storage.objects;

CREATE POLICY "prescriptions_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'prescriptions');

CREATE POLICY "prescriptions_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'prescriptions');

CREATE POLICY "prescriptions_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'prescriptions');

CREATE POLICY "prescriptions_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'prescriptions');

-- ── patient-docs bucket ───────────────────────────────────────
DROP POLICY IF EXISTS "patientdocs_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "patientdocs_auth_insert"  ON storage.objects;
DROP POLICY IF EXISTS "patientdocs_auth_update"  ON storage.objects;
DROP POLICY IF EXISTS "patientdocs_auth_delete"  ON storage.objects;

CREATE POLICY "patientdocs_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'patient-docs');

CREATE POLICY "patientdocs_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-docs');

CREATE POLICY "patientdocs_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'patient-docs');

CREATE POLICY "patientdocs_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'patient-docs');

-- ── clinic-assets bucket ──────────────────────────────────────
DROP POLICY IF EXISTS "clinicassets_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "clinicassets_auth_insert"  ON storage.objects;
DROP POLICY IF EXISTS "clinicassets_auth_update"  ON storage.objects;
DROP POLICY IF EXISTS "clinicassets_auth_delete"  ON storage.objects;

CREATE POLICY "clinicassets_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'clinic-assets');

CREATE POLICY "clinicassets_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clinic-assets');

CREATE POLICY "clinicassets_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'clinic-assets');

CREATE POLICY "clinicassets_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'clinic-assets');
