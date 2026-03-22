-- ============================================================
--  USS-I.COM — Database Schema (Supabase/PostgreSQL)
--  Paste this into Supabase SQL Editor → Run
-- ============================================================

-- ENUMS
DO $$ BEGIN
  CREATE TYPE "Triage" AS ENUM ('P1', 'P2', 'P3', 'P4');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatutVisite" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'TERMINE', 'TRANSFERE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Orientation" AS ENUM ('SORTIE_DOMICILE', 'HOSPITALISATION', 'TRANSFERT_SAMU', 'OBSERVATION_UHCD', 'DECES');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Sexe" AS ENUM ('M', 'F');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypeMedicament" AS ENUM ('P', 'G');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatutBilan" AS ENUM ('PRESCRIT', 'EN_ATTENTE_RESULTAT', 'RESULTAT_DISPONIBLE', 'CRITIQUE', 'ANNULE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RoleUser" AS ENUM ('MEDECIN_URGENTISTE', 'INFIRMIER', 'AGENT_ACCUEIL', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "users" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "supabaseId"  TEXT NOT NULL UNIQUE,
  "email"       TEXT NOT NULL UNIQUE,
  "nom"         TEXT NOT NULL,
  "prenom"      TEXT NOT NULL,
  "role"        "RoleUser" NOT NULL DEFAULT 'MEDECIN_URGENTISTE',
  "specialite"  TEXT,
  "telephone"   TEXT,
  "actif"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- PATIENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "patients" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cin"              TEXT UNIQUE,
  "nom"              TEXT NOT NULL,
  "prenom"           TEXT NOT NULL,
  "dateNaissance"    TIMESTAMPTZ,
  "sexe"             "Sexe" NOT NULL,
  "telephone"        TEXT,
  "telephoneUrgence" TEXT,
  "contactUrgence"   TEXT,
  "email"            TEXT,
  "adresse"          TEXT,
  "ville"            TEXT,
  "groupeSanguin"    TEXT,
  "mutuelle"         TEXT,
  "medecinTraitant"  TEXT,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "patients_cin_idx" ON "patients" ("cin");
CREATE INDEX IF NOT EXISTS "patients_nom_prenom_idx" ON "patients" ("nom", "prenom");

-- ─────────────────────────────────────────
-- BOXES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "boxes" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "numero"    INTEGER NOT NULL UNIQUE,
  "nom"       TEXT NOT NULL,
  "type"      TEXT,
  "actif"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- VISITES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "visites" (
  "id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId"            UUID NOT NULL REFERENCES "patients"("id"),
  "triage"               "Triage" NOT NULL DEFAULT 'P3',
  "motif"                TEXT NOT NULL,
  "triageAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
  "medecinTriageId"      UUID REFERENCES "users"("id"),
  "statut"               "StatutVisite" NOT NULL DEFAULT 'EN_ATTENTE',
  "boxId"                UUID REFERENCES "boxes"("id"),
  "medecinPECId"         UUID REFERENCES "users"("id"),
  "prisEnChargeAt"       TIMESTAMPTZ,
  "orientation"          "Orientation",
  "diagnosticPrincipal"  TEXT,
  "diagnosticLibelle"    TEXT,
  "conduiteATenir"       TEXT,
  "examenClinique"       TEXT,
  "termineeAt"           TIMESTAMPTZ,
  "dureeMinutes"         INTEGER,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "visites_patientId_idx" ON "visites" ("patientId");
CREATE INDEX IF NOT EXISTS "visites_statut_idx" ON "visites" ("statut");
CREATE INDEX IF NOT EXISTS "visites_triage_idx" ON "visites" ("triage");
CREATE INDEX IF NOT EXISTS "visites_triageAt_idx" ON "visites" ("triageAt");

-- ─────────────────────────────────────────
-- CONSTANTES VITALES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "constantes_vitales" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "visiteId"      UUID NOT NULL REFERENCES "visites"("id") ON DELETE CASCADE,
  "taSystolique"  INTEGER,
  "taDiastolique" INTEGER,
  "fc"            INTEGER,
  "spo2"          DOUBLE PRECISION,
  "fr"            INTEGER,
  "temperature"   DOUBLE PRECISION,
  "glasgow"       INTEGER,
  "glycemie"      DOUBLE PRECISION,
  "eva"           INTEGER,
  "poids"         DOUBLE PRECISION,
  "taille"        DOUBLE PRECISION,
  "imc"           DOUBLE PRECISION,
  "notes"         TEXT,
  "releveAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "constantes_vitales_visiteId_idx" ON "constantes_vitales" ("visiteId");
CREATE INDEX IF NOT EXISTS "constantes_vitales_releveAt_idx" ON "constantes_vitales" ("releveAt");

-- ─────────────────────────────────────────
-- CONSULTATIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "consultations" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "visiteId"          UUID NOT NULL UNIQUE REFERENCES "visites"("id") ON DELETE CASCADE,
  "medecinId"         UUID NOT NULL REFERENCES "users"("id"),
  "subjectif"         TEXT,
  "objectif"          TEXT,
  "assessment"        TEXT,
  "plan"              TEXT,
  "diagnosticCIM10"   TEXT,
  "diagnosticLibelle" TEXT,
  "isDraft"           BOOLEAN NOT NULL DEFAULT true,
  "finaliseeAt"       TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- PRESCRIPTIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "prescriptions" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "visiteId"        UUID NOT NULL REFERENCES "visites"("id") ON DELETE CASCADE,
  "isDraft"         BOOLEAN NOT NULL DEFAULT true,
  "valideeAt"       TIMESTAMPTZ,
  "imprimeeAt"      TIMESTAMPTZ,
  "totalEstimeMad"  DOUBLE PRECISION,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "prescriptions_visiteId_idx" ON "prescriptions" ("visiteId");

-- ─────────────────────────────────────────
-- PRESCRIPTION ITEMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "prescription_items" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "prescriptionId"  UUID NOT NULL REFERENCES "prescriptions"("id") ON DELETE CASCADE,
  "medicamentId"    TEXT NOT NULL,
  "dose"            TEXT,
  "frequence"       TEXT,
  "duree"           TEXT,
  "voie"            TEXT,
  "instructions"    TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- BILANS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "bilans" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "visiteId"    UUID NOT NULL REFERENCES "visites"("id") ON DELETE CASCADE,
  "code"        TEXT NOT NULL,
  "libelle"     TEXT NOT NULL,
  "type"        TEXT,
  "statut"      "StatutBilan" NOT NULL DEFAULT 'PRESCRIT',
  "resultat"    TEXT,
  "isCritique"  BOOLEAN NOT NULL DEFAULT false,
  "notes"       TEXT,
  "prescritAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "resultatAt"  TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "bilans_visiteId_idx" ON "bilans" ("visiteId");

-- ─────────────────────────────────────────
-- MEDICAMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "medicaments" (
  "id"                      TEXT PRIMARY KEY,
  "nomCommercial"           TEXT NOT NULL,
  "dci"                     TEXT NOT NULL,
  "dosage"                  TEXT,
  "forme"                   TEXT,
  "presentation"            TEXT,
  "laboratoire"             TEXT,
  "ppv"                     DOUBLE PRECISION,
  "prixHopital"             DOUBLE PRECISION,
  "prixBaseRemboursement"   DOUBLE PRECISION,
  "type"                    "TypeMedicament" NOT NULL DEFAULT 'P',
  "tauxRemboursement"       INTEGER NOT NULL DEFAULT 0,
  "actif"                   BOOLEAN NOT NULL DEFAULT true,
  "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "medicaments_nomCommercial_idx" ON "medicaments" ("nomCommercial");
CREATE INDEX IF NOT EXISTS "medicaments_dci_idx" ON "medicaments" ("dci");
CREATE INDEX IF NOT EXISTS "medicaments_forme_idx" ON "medicaments" ("forme");

-- Add FK for prescription_items → medicaments (after both tables exist)
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_medicamentId_fkey"
  FOREIGN KEY ("medicamentId") REFERENCES "medicaments"("id");

-- ─────────────────────────────────────────
-- ANTECEDENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "antecedents" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId"   UUID NOT NULL,
  "type"        TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "dateDebut"   TIMESTAMPTZ,
  "dateFin"     TIMESTAMPTZ,
  "actif"       BOOLEAN NOT NULL DEFAULT true,
  "notes"       TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "antecedents_patientId_idx" ON "antecedents" ("patientId");
CREATE INDEX IF NOT EXISTS "antecedents_type_idx" ON "antecedents" ("type");

-- ─────────────────────────────────────────
-- ALLERGIES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "allergies" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL,
  "substance" TEXT NOT NULL,
  "reaction"  TEXT,
  "severite"  TEXT,
  "confirmee" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "allergies_patientId_idx" ON "allergies" ("patientId");

-- ─────────────────────────────────────────
-- ENCAISSEMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "encaissements" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "visiteId"        UUID NOT NULL,
  "montantTotal"    DOUBLE PRECISION NOT NULL,
  "montantPaye"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "montantRestant"  DOUBLE PRECISION NOT NULL,
  "modePaiement"    TEXT,
  "mutuelle"        TEXT,
  "tauxCouverture"  DOUBLE PRECISION,
  "notes"           TEXT,
  "payeAt"          TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "encaissements_visiteId_idx" ON "encaissements" ("visiteId");

-- ─────────────────────────────────────────
-- SEED DATA (Boxes)
-- ─────────────────────────────────────────
INSERT INTO "boxes" ("numero", "nom", "type") VALUES
  (1, 'Box 1', 'standard'),
  (2, 'Box 2', 'standard'),
  (3, 'Box 3', 'standard'),
  (4, 'Box Réanimation', 'reanimation'),
  (5, 'Box Plâtre', 'platre'),
  (6, 'Box Isolement', 'isolement')
ON CONFLICT ("numero") DO NOTHING;

-- Done!
SELECT 'All tables created successfully!' AS result;
