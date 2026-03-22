-- ============================================================
--  USS-I.COM — Migration initiale
--  Généré depuis prisma/schema.prisma
--  À appliquer via : Supabase Dashboard > SQL Editor
--  Ou via CLI : psql $DIRECT_URL -f migration.sql
-- ============================================================

-- ── EXTENSIONS ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- recherche full-text médicaments

-- ── ENUMS ────────────────────────────────────────────────────

CREATE TYPE "Triage" AS ENUM ('P1', 'P2', 'P3', 'P4');
CREATE TYPE "StatutVisite" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'TERMINE', 'TRANSFERE');
CREATE TYPE "Orientation" AS ENUM ('SORTIE_DOMICILE', 'HOSPITALISATION', 'TRANSFERT_SAMU', 'OBSERVATION_UHCD', 'DECES');
CREATE TYPE "Sexe" AS ENUM ('M', 'F');
CREATE TYPE "TypeMedicament" AS ENUM ('P', 'G');
CREATE TYPE "StatutBilan" AS ENUM ('PRESCRIT', 'EN_ATTENTE_RESULTAT', 'RESULTAT_DISPONIBLE', 'CRITIQUE', 'ANNULE');
CREATE TYPE "RoleUser" AS ENUM ('MEDECIN_URGENTISTE', 'INFIRMIER', 'AGENT_ACCUEIL', 'ADMIN');

-- ── USERS ────────────────────────────────────────────────────

CREATE TABLE "users" (
    "id"           UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "supabaseId"   TEXT         NOT NULL,
    "email"        TEXT         NOT NULL,
    "nom"          TEXT         NOT NULL,
    "prenom"       TEXT         NOT NULL,
    "role"         "RoleUser"   NOT NULL DEFAULT 'MEDECIN_URGENTISTE',
    "specialite"   TEXT,
    "telephone"    TEXT,
    "actif"        BOOLEAN      NOT NULL DEFAULT TRUE,
    "createdAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_supabaseId_key" ON "users"("supabaseId");
CREATE UNIQUE INDEX "users_email_key"      ON "users"("email");

-- ── PATIENTS ─────────────────────────────────────────────────

CREATE TABLE "patients" (
    "id"               UUID        NOT NULL DEFAULT uuid_generate_v4(),
    "cin"              TEXT,
    "nom"              TEXT        NOT NULL,
    "prenom"           TEXT        NOT NULL,
    "dateNaissance"    DATE,
    "sexe"             "Sexe"      NOT NULL,
    "telephone"        TEXT,
    "telephoneUrgence" TEXT,
    "contactUrgence"   TEXT,
    "email"            TEXT,
    "adresse"          TEXT,
    "ville"            TEXT,
    "groupeSanguin"    TEXT,
    "mutuelle"         TEXT,
    "medecinTraitant"  TEXT,
    "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "patients_cin_key" ON "patients"("cin") WHERE "cin" IS NOT NULL;
CREATE INDEX "patients_nom_prenom_idx" ON "patients"("nom", "prenom");
-- Full-text search sur nom+prenom
CREATE INDEX "patients_search_idx" ON "patients" USING gin(
    (to_tsvector('simple', "nom" || ' ' || "prenom"))
);

-- ── BOXES ────────────────────────────────────────────────────

CREATE TABLE "boxes" (
    "id"        UUID    NOT NULL DEFAULT uuid_generate_v4(),
    "numero"    INTEGER NOT NULL,
    "nom"       TEXT    NOT NULL,
    "type"      TEXT,
    "actif"     BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "boxes_pkey"   PRIMARY KEY ("id"),
    CONSTRAINT "boxes_numero" UNIQUE ("numero")
);

-- Seed boxes de base
INSERT INTO "boxes" ("numero", "nom", "type") VALUES
    (1,  'Box 1',          'standard'),
    (2,  'Box 2',          'standard'),
    (3,  'Box 3',          'standard'),
    (4,  'Box Réa',        'reanimation'),
    (5,  'Box Plâtre',     'platre'),
    (6,  'Box Isolement',  'isolement');

-- ── VISITES ──────────────────────────────────────────────────

CREATE TABLE "visites" (
    "id"                  UUID           NOT NULL DEFAULT uuid_generate_v4(),
    "patientId"           UUID           NOT NULL,
    "triage"              "Triage"       NOT NULL DEFAULT 'P3',
    "motif"               TEXT           NOT NULL,
    "triageAt"            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "medecinTriageId"     UUID,
    "statut"              "StatutVisite" NOT NULL DEFAULT 'EN_ATTENTE',
    "boxId"               UUID,
    "medecinPECId"        UUID,
    "prisEnChargeAt"      TIMESTAMPTZ,
    "orientation"         "Orientation",
    "diagnosticPrincipal" TEXT,
    "diagnosticLibelle"   TEXT,
    "conduiteATenir"      TEXT,
    "examenClinique"      TEXT,
    "termineeAt"          TIMESTAMPTZ,
    "dureeMinutes"        INTEGER,
    "createdAt"           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "updatedAt"           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT "visites_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "visites_patientId_fkey"       FOREIGN KEY ("patientId")       REFERENCES "patients"("id") ON DELETE RESTRICT,
    CONSTRAINT "visites_boxId_fkey"           FOREIGN KEY ("boxId")           REFERENCES "boxes"("id")    ON DELETE SET NULL,
    CONSTRAINT "visites_medecinTriageId_fkey" FOREIGN KEY ("medecinTriageId") REFERENCES "users"("id")    ON DELETE SET NULL,
    CONSTRAINT "visites_medecinPECId_fkey"    FOREIGN KEY ("medecinPECId")    REFERENCES "users"("id")    ON DELETE SET NULL
);

CREATE INDEX "visites_patientId_idx" ON "visites"("patientId");
CREATE INDEX "visites_statut_idx"    ON "visites"("statut");
CREATE INDEX "visites_triage_idx"    ON "visites"("triage");
CREATE INDEX "visites_triageAt_idx"  ON "visites"("triageAt" DESC);

-- ── CONSTANTES VITALES ───────────────────────────────────────

CREATE TABLE "constantes_vitales" (
    "id"            UUID        NOT NULL DEFAULT uuid_generate_v4(),
    "visiteId"      UUID        NOT NULL,
    "taSystolique"  INTEGER,
    "taDiastolique" INTEGER,
    "fc"            INTEGER,
    "spo2"          NUMERIC(4,1),
    "fr"            INTEGER,
    "temperature"   NUMERIC(4,1),
    "glasgow"       INTEGER,
    "glycemie"      NUMERIC(4,2),
    "eva"           INTEGER,
    "poids"         NUMERIC(5,1),
    "taille"        NUMERIC(5,1),
    "imc"           NUMERIC(4,1) GENERATED ALWAYS AS (
                        CASE WHEN "taille" > 0
                        THEN ROUND(("poids" / (("taille"/100) * ("taille"/100)))::NUMERIC, 1)
                        ELSE NULL END
                    ) STORED,
    "notes"         TEXT,
    "releveAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "constantes_vitales_pkey"    PRIMARY KEY ("id"),
    CONSTRAINT "constantes_vitales_vis_fk"  FOREIGN KEY ("visiteId") REFERENCES "visites"("id") ON DELETE CASCADE,
    CONSTRAINT "eva_range"      CHECK ("eva" BETWEEN 0 AND 10),
    CONSTRAINT "glasgow_range"  CHECK ("glasgow" BETWEEN 3 AND 15),
    CONSTRAINT "spo2_range"     CHECK ("spo2" BETWEEN 0 AND 100)
);

CREATE INDEX "constantes_visiteId_idx" ON "constantes_vitales"("visiteId");
CREATE INDEX "constantes_releveAt_idx" ON "constantes_vitales"("releveAt" DESC);

-- ── CONSULTATIONS ────────────────────────────────────────────

CREATE TABLE "consultations" (
    "id"               UUID        NOT NULL DEFAULT uuid_generate_v4(),
    "visiteId"         UUID        NOT NULL,
    "medecinId"        UUID        NOT NULL,
    "subjectif"        TEXT,
    "objectif"         TEXT,
    "assessment"       TEXT,
    "plan"             TEXT,
    "diagnosticCIM10"  TEXT,
    "diagnosticLibelle" TEXT,
    "isDraft"          BOOLEAN     NOT NULL DEFAULT TRUE,
    "finaliseeAt"      TIMESTAMPTZ,
    "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "consultations_pkey"      PRIMARY KEY ("id"),
    CONSTRAINT "consultations_vis_uniq"  UNIQUE ("visiteId"),
    CONSTRAINT "consultations_vis_fk"    FOREIGN KEY ("visiteId")  REFERENCES "visites"("id") ON DELETE CASCADE,
    CONSTRAINT "consultations_user_fk"   FOREIGN KEY ("medecinId") REFERENCES "users"("id")   ON DELETE RESTRICT
);

-- ── MÉDICAMENTS (référentiel CNOPS 2014) ─────────────────────

CREATE TABLE "medicaments" (
    "id"                    TEXT              NOT NULL,  -- EAN-13
    "nomCommercial"         TEXT              NOT NULL,
    "dci"                   TEXT              NOT NULL,
    "dosage"                TEXT,
    "forme"                 TEXT,
    "presentation"          TEXT,
    "laboratoire"           TEXT,
    "ppv"                   NUMERIC(10,2),
    "prixHopital"           NUMERIC(10,2),
    "prixBaseRemboursement" NUMERIC(10,2),
    "type"                  "TypeMedicament"  NOT NULL DEFAULT 'P',
    "tauxRemboursement"     INTEGER           NOT NULL DEFAULT 0,
    "actif"                 BOOLEAN           NOT NULL DEFAULT TRUE,
    "createdAt"             TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    "updatedAt"             TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

    CONSTRAINT "medicaments_pkey"   PRIMARY KEY ("id"),
    CONSTRAINT "taux_remb_check"    CHECK ("tauxRemboursement" IN (0, 70))
);

CREATE INDEX "medicaments_nom_idx" ON "medicaments" USING gin("nomCommercial" gin_trgm_ops);
CREATE INDEX "medicaments_dci_idx" ON "medicaments" USING gin("dci" gin_trgm_ops);
CREATE INDEX "medicaments_forme_idx" ON "medicaments"("forme");
CREATE INDEX "medicaments_type_idx"  ON "medicaments"("type");

-- ── PRESCRIPTIONS ────────────────────────────────────────────

CREATE TABLE "prescriptions" (
    "id"              UUID        NOT NULL DEFAULT uuid_generate_v4(),
    "visiteId"        UUID        NOT NULL,
    "isDraft"         BOOLEAN     NOT NULL DEFAULT TRUE,
    "valideeAt"       TIMESTAMPTZ,
    "imprimeeAt"      TIMESTAMPTZ,
    "totalEstimeMad"  NUMERIC(10,2),
    "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "prescriptions_pkey"    PRIMARY KEY ("id"),
    CONSTRAINT "prescriptions_vis_fk"  FOREIGN KEY ("visiteId") REFERENCES "visites"("id") ON DELETE CASCADE
);

CREATE INDEX "prescriptions_visiteId_idx" ON "prescriptions"("visiteId");

CREATE TABLE "prescription_items" (
    "id"             UUID        NOT NULL DEFAULT uuid_generate_v4(),
    "prescriptionId" UUID        NOT NULL,
    "medicamentId"   TEXT        NOT NULL,
    "dose"           TEXT,
    "frequence"      TEXT,
    "duree"          TEXT,
    "voie"           TEXT,
    "instructions"   TEXT,
    "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "presc_items_pkey"    PRIMARY KEY ("id"),
    CONSTRAINT "presc_items_pres_fk" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE,
    CONSTRAINT "presc_items_med_fk"  FOREIGN KEY ("medicamentId")   REFERENCES "medicaments"("id")   ON DELETE RESTRICT
);

-- ── BILANS & EXAMENS ─────────────────────────────────────────

CREATE TABLE "bilans" (
    "id"          UUID          NOT NULL DEFAULT uuid_generate_v4(),
    "visiteId"    UUID          NOT NULL,
    "code"        TEXT          NOT NULL,
    "libelle"     TEXT          NOT NULL,
    "type"        TEXT,
    "statut"      "StatutBilan" NOT NULL DEFAULT 'PRESCRIT',
    "resultat"    TEXT,
    "isCritique"  BOOLEAN       NOT NULL DEFAULT FALSE,
    "notes"       TEXT,
    "prescritAt"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "resultatAt"  TIMESTAMPTZ,
    "createdAt"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT "bilans_pkey"   PRIMARY KEY ("id"),
    CONSTRAINT "bilans_vis_fk" FOREIGN KEY ("visiteId") REFERENCES "visites"("id") ON DELETE CASCADE
);

CREATE INDEX "bilans_visiteId_idx" ON "bilans"("visiteId");

-- ── ANTÉCÉDENTS ──────────────────────────────────────────────

CREATE TABLE "antecedents" (
    "id"          UUID        NOT NULL DEFAULT uuid_generate_v4(),
    "patientId"   UUID        NOT NULL,
    "type"        TEXT        NOT NULL,
    "description" TEXT        NOT NULL,
    "dateDebut"   DATE,
    "dateFin"     DATE,
    "actif"       BOOLEAN     NOT NULL DEFAULT TRUE,
    "notes"       TEXT,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "antecedents_pkey"   PRIMARY KEY ("id"),
    CONSTRAINT "antecedents_pat_fk" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE
);

CREATE INDEX "antecedents_patientId_idx" ON "antecedents"("patientId");
CREATE INDEX "antecedents_type_idx"      ON "antecedents"("type");

-- ── ALLERGIES ────────────────────────────────────────────────

CREATE TABLE "allergies" (
    "id"          UUID        NOT NULL DEFAULT uuid_generate_v4(),
    "patientId"   UUID        NOT NULL,
    "substance"   TEXT        NOT NULL,
    "reaction"    TEXT,
    "severite"    TEXT,
    "confirmee"   BOOLEAN     NOT NULL DEFAULT FALSE,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "allergies_pkey"   PRIMARY KEY ("id"),
    CONSTRAINT "allergies_pat_fk" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE
);

CREATE INDEX "allergies_patientId_idx" ON "allergies"("patientId");

-- ── ENCAISSEMENTS ────────────────────────────────────────────

CREATE TABLE "encaissements" (
    "id"              UUID        NOT NULL DEFAULT uuid_generate_v4(),
    "visiteId"        UUID        NOT NULL,
    "montantTotal"    NUMERIC(10,2) NOT NULL,
    "montantPaye"     NUMERIC(10,2) NOT NULL DEFAULT 0,
    "montantRestant"  NUMERIC(10,2) GENERATED ALWAYS AS ("montantTotal" - "montantPaye") STORED,
    "modePaiement"    TEXT,
    "mutuelle"        TEXT,
    "tauxCouverture"  NUMERIC(5,2),
    "notes"           TEXT,
    "payeAt"          TIMESTAMPTZ,
    "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "encaissements_pkey"   PRIMARY KEY ("id"),
    CONSTRAINT "encaissements_vis_fk" FOREIGN KEY ("visiteId") REFERENCES "visites"("id") ON DELETE RESTRICT
);

CREATE INDEX "encaissements_visiteId_idx" ON "encaissements"("visiteId");

-- ── TRIGGER updated_at (automatique) ────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'users','patients','visites','consultations',
        'medicaments','prescriptions','bilans',
        'antecedents','encaissements'
    ] LOOP
        EXECUTE format('
            CREATE TRIGGER trg_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        ', t, t);
    END LOOP;
END;
$$;

-- ── ROW LEVEL SECURITY (RLS) ─────────────────────────────────
-- Activer RLS sur toutes les tables sensibles

ALTER TABLE "users"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "patients"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "visites"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "constantes_vitales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consultations"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prescriptions"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prescription_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bilans"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "antecedents"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "allergies"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "encaissements"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "medicaments"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "boxes"             ENABLE ROW LEVEL SECURITY;

-- Politique : accès total pour les utilisateurs authentifiés
-- (À affiner selon les rôles en production)

CREATE POLICY "authenticated_full_access" ON "users"
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "authenticated_full_access" ON "patients"
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "authenticated_full_access" ON "visites"
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "authenticated_full_access" ON "constantes_vitales"
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "authenticated_full_access" ON "consultations"
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "authenticated_full_access" ON "prescriptions"
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "authenticated_full_access" ON "prescription_items"
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "authenticated_full_access" ON "bilans"
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "authenticated_full_access" ON "antecedents"
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "authenticated_full_access" ON "allergies"
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "authenticated_full_access" ON "encaissements"
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Médicaments : lecture publique, écriture admin seulement
CREATE POLICY "medicaments_read" ON "medicaments"
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "boxes_read" ON "boxes"
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "boxes_write" ON "boxes"
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- ── VUES UTILES ──────────────────────────────────────────────

-- Salle d'attente : visites actives avec infos patient
CREATE OR REPLACE VIEW "v_salle_attente" AS
SELECT
    v.id                              AS visite_id,
    v.triage,
    v.motif,
    v."triageAt",
    v.statut,
    v."boxId",
    b.nom                             AS box_nom,
    EXTRACT(EPOCH FROM (NOW() - v."triageAt")) / 60  AS attente_minutes,
    p.id                              AS patient_id,
    p.nom                             AS patient_nom,
    p.prenom                          AS patient_prenom,
    p.sexe,
    EXTRACT(YEAR FROM AGE(p."dateNaissance"))  AS age,
    p."groupeSanguin",
    p.mutuelle,
    -- Dernières constantes
    cv."taSystolique",
    cv."taDiastolique",
    cv.fc,
    cv.spo2,
    cv.temperature,
    cv.eva
FROM visites v
JOIN patients p ON p.id = v."patientId"
LEFT JOIN boxes b ON b.id = v."boxId"
LEFT JOIN LATERAL (
    SELECT * FROM constantes_vitales
    WHERE "visiteId" = v.id
    ORDER BY "releveAt" DESC
    LIMIT 1
) cv ON TRUE
WHERE v.statut IN ('EN_ATTENTE', 'EN_COURS')
ORDER BY
    CASE v.triage WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 ELSE 4 END,
    v."triageAt" ASC;

-- ── FIN DE LA MIGRATION ───────────────────────────────────────
