// Shared types for patient view
export interface Allergie {
  id: string; substance: string; severite: string; confirmee: boolean
}
export interface Antecedent {
  id: string; type: string; description: string; actif: boolean; dateDebut?: string | null
}
export interface Constante {
  id: string; releveAt: string
  taSystolique: number | null; taDiastolique: number | null
  fc: number | null; fr: number | null; spo2: number | null
  temperature: number | null; glycemie: number | null
  eva: number | null; poids: number | null; glasgow: number | null
}
export interface Bilan {
  id: string; code: string; libelle: string; type: string
  statut: string; resultat: string | null; isCritique: boolean
  resultatAt: string | null; prescritAt: string
}
export interface PrescItem {
  id: string; medicamentId: string; nomCommercial: string; dci: string
  dose: string | null; frequence: string | null; duree: string | null
  voie: string | null; instructions: string | null
}
export interface Prescription {
  id: string; createdAt: string; isDraft: boolean; items: PrescItem[]
}
export interface Consultation {
  id: string; subjectif: string | null; objectif: string | null
  assessment: string | null; plan: string | null
  isDraft: boolean; updatedAt: string
}
export interface Visite {
  id: string; triage: string; motif: string | null; statut: string
  triageAt: string; orientation: string | null
  box: { nom: string } | null
  constantesVitales: Constante[]
  consultation: Consultation | null
  bilans: Bilan[]
  prescriptions: Prescription[]
}
export interface PatientData {
  id: string; cin: string | null; nom: string; prenom: string
  dateNaissance: string | null; sexe: string
  telephone: string | null; groupeSanguin: string | null
  mutuelle: string | null; medecinTraitant: string | null
  allergies: Allergie[]; antecedents: Antecedent[]
  visites: Array<{ id: string; triage: string; motif: string | null; statut: string; triageAt: string }>
}
