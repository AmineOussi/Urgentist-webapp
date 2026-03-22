// ──────────────────────────────────────────────────────────────
//  USS-I — Shared TypeScript types
// ──────────────────────────────────────────────────────────────

export type TriageKey = 'P1' | 'P2' | 'P3' | 'P4'

export interface PatientDetail {
  id:             string
  cin:            string
  nom:            string
  prenom:         string
  dateNaissance:  string | null
  sexe:           'M' | 'F' | 'AUTRE'
  telephone:      string | null
  groupeSanguin:  string | null
  mutuelle:       string | null
  medecinTraitant: string | null
  allergies: Array<{
    id:         string
    substance:  string
    severite:   string
    confirmee:  boolean
  }>
  antecedents: Array<{
    id:          string
    type:        string
    description: string
    actif:       boolean
  }>
  visites: Array<{
    id:      string
    triage:  string
    motif:   string | null
    statut:  string
    triageAt: string
  }>
}

export interface VisiteDetail {
  id:         string
  triage:     string
  motif:      string | null
  statut:     string
  triageAt:   string
  orientation: string | null
  patientId:  string
  box: { nom: string } | null
  constantesVitales: ConstantesVitales[]
  consultation: ConsultationData | null
  bilans: BilanData[]
  prescriptions: PrescriptionData[]
}

export interface ConstantesVitales {
  id:            string
  releveAt:      string
  taSystolique:  number | null
  taDiastolique: number | null
  fc:            number | null
  fr:            number | null
  spo2:          number | null
  temperature:   number | null
  glycemie:      number | null
  eva:           number | null
  poids:         number | null
}

export interface ConsultationData {
  id:           string
  subjective:   string | null
  objective:    string | null
  assessment:   string | null
  plan:         string | null
  updatedAt:    string
}

export interface BilanData {
  id:          string
  code:        string
  libelle:     string
  type:        string
  statut:      string
  resultat:    string | null
  isCritique:  boolean
  resultatAt:  string | null
  prescritAt:  string
}

export interface PrescriptionData {
  id:        string
  createdAt: string
  items: Array<{
    id:                string
    medicamentId:      string
    nomCommercial:     string
    dci:               string
    posologie:         string | null
    duree:             string | null
    quantite:          number | null
    instructions:      string | null
  }>
}
