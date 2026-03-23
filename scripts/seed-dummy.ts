#!/usr/bin/env tsx
// ──────────────────────────────────────────────────────────────
//  USS-I — Seed données de démonstration (10 patients complets)
//  Usage: npm run db:seed-dummy
// ──────────────────────────────────────────────────────────────

import {
  PrismaClient,
  Triage,
  Sexe,
  StatutVisite,
  Orientation,
  StatutBilan,
} from '@prisma/client'

const prisma = new PrismaClient()

// ── Helpers ─────────────────────────────────────────────────────
function ago(days: number, hours = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(d.getHours() - hours)
  return d
}

// ── Données médicaments fictifs (quelques références réalistes) ──
const MEDS = [
  { id: '3400936819702', nomCommercial: 'AMOXICILLINE 500MG', dci: 'Amoxicilline', dosage: '500 mg', forme: 'Gélule', presentation: 'Boîte de 16', ppv: 22.5 },
  { id: '3400936819703', nomCommercial: 'PARACETAMOL 1G',    dci: 'Paracétamol',  dosage: '1 g',    forme: 'Comprimé', presentation: 'Boîte de 8', ppv: 14.0 },
  { id: '3400936819704', nomCommercial: 'METFORMINE 850MG',  dci: 'Metformine',   dosage: '850 mg', forme: 'Comprimé', presentation: 'Boîte de 30', ppv: 35.0 },
  { id: '3400936819705', nomCommercial: 'AMLODIPINE 5MG',    dci: 'Amlodipine',   dosage: '5 mg',   forme: 'Comprimé', presentation: 'Boîte de 30', ppv: 42.0 },
  { id: '3400936819706', nomCommercial: 'IBUPROFENE 400MG',  dci: 'Ibuprofène',   dosage: '400 mg', forme: 'Comprimé', presentation: 'Boîte de 24', ppv: 18.5 },
  { id: '3400936819707', nomCommercial: 'OMEPRAZOLE 20MG',   dci: 'Oméprazole',   dosage: '20 mg',  forme: 'Gélule',   presentation: 'Boîte de 28', ppv: 55.0 },
  { id: '3400936819708', nomCommercial: 'ATORVASTATINE 20MG',dci: 'Atorvastatine',dosage: '20 mg',  forme: 'Comprimé', presentation: 'Boîte de 30', ppv: 88.0 },
  { id: '3400936819709', nomCommercial: 'SALBUTAMOL INH',    dci: 'Salbutamol',   dosage: '100 µg', forme: 'Inhalateur', presentation: '200 doses', ppv: 65.0 },
  { id: '3400936819710', nomCommercial: 'FUROSEMIDE 40MG',   dci: 'Furosémide',   dosage: '40 mg',  forme: 'Comprimé', presentation: 'Boîte de 30', ppv: 28.0 },
  { id: '3400936819711', nomCommercial: 'DOLIPRANE 500MG',   dci: 'Paracétamol',  dosage: '500 mg', forme: 'Comprimé', presentation: 'Boîte de 16', ppv: 12.0 },
]

// ── Données patients ─────────────────────────────────────────────
const PATIENTS_DATA = [
  {
    cin: 'AA100001', nom: 'AMRANI',    prenom: 'Youssef',   sexe: Sexe.M, dateNaissance: new Date('1979-04-12'),
    telephone: '0661-100001', groupeSanguin: 'A+',  mutuelle: 'CNSS',  medecinTraitant: 'Dr. Tahiri',
    adresse: '12 Rue Ibn Battouta', ville: 'Casablanca',
    allergies: [
      { substance: 'Pénicilline', reaction: 'Urticaire généralisée', severite: 'severe', confirmee: true },
    ],
    antecedents: [
      { type: 'medical',             description: 'Hypertension artérielle',   dateDebut: new Date('2015-02-01'), actif: true },
      { type: 'medical',             description: 'Diabète type 2',             dateDebut: new Date('2019-07-01'), actif: true },
      { type: 'traitement_habituel', description: 'Metformine 850mg — 2×/j',   actif: true },
      { type: 'traitement_habituel', description: 'Amlodipine 5mg — 1×/j',     actif: true },
    ],
    visites: [
      {
        triage: Triage.P2, motif: 'Douleur thoracique oppressante, dyspnée au repos',
        statut: StatutVisite.TERMINE, orientation: Orientation.HOSPITALISATION,
        diagnosticPrincipal: 'I20.0', diagnosticLibelle: 'Angor instable',
        triageAt: ago(5, 3), prisEnChargeAt: ago(5, 2), termineeAt: ago(5, 0), dureeMinutes: 185,
        constantes: [
          { releveAt: ago(5, 3), taSystolique: 162, taDiastolique: 98, fc: 108, spo2: 94, temperature: 37.2, eva: 7, poids: 82, taille: 175 },
          { releveAt: ago(5, 2), taSystolique: 155, taDiastolique: 94, fc: 102, spo2: 95, temperature: 37.1, eva: 6 },
        ],
        soap: {
          subjectif: 'Patient de 45 ans, diabétique hypertendu, consulte pour douleur thoracique constrictive irradiant au bras gauche depuis 2h. Sueurs froides associées.',
          objectif: 'TA 162/98 mmHg, FC 108 bpm, SpO2 94% AA. Auscultation : quelques râles crépitants bases pulmonaires. Abdomen souple.',
          assessment: 'Syndrome coronarien aigu sans sus-décalage ST. ECG : sous-décalage ST en V4-V5.',
          plan: 'Hospitalisation en USIC. Aspirine 300mg PO, Héparine IV, monitoring continu. Avis cardiologie urgente.',
          diagnosticCIM10: 'I20.0', diagnosticLibelle: 'Angor instable', isDraft: false,
        },
        bilans: [
          { code: 'TROP', libelle: 'Troponine I ultrasensible', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: '0.085 ng/mL ↑', isCritique: true,  resultatAt: ago(5, 2) },
          { code: 'NFS',  libelle: 'Numération Formule Sanguine', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'GB 11.2 G/L', isCritique: false, resultatAt: ago(5, 2) },
          { code: 'CRP',  libelle: 'C-Réactive Protéine', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: '32 mg/L ↑', isCritique: false, resultatAt: ago(5, 2) },
          { code: 'ECG',  libelle: 'ECG 12 dérivations', type: 'ecg', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'Sous-décalage ST V4-V5, onde T négative', isCritique: true, resultatAt: ago(5, 2) },
          { code: 'RX',   libelle: 'Radio Thorax', type: 'imagerie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'Cardiomégalie modérée, hilaires chargés', isCritique: false, resultatAt: ago(5, 1) },
        ],
        prescription: {
          isDraft: false,
          items: [
            { medId: '3400936819702', dose: '300 mg', frequence: '1×/j', duree: '30 jours', voie: 'oral' },
            { medId: '3400936819706', dose: '400 mg', frequence: '3×/j', duree: '5 jours',  voie: 'oral', instructions: 'À prendre pendant le repas' },
          ],
        },
      },
    ],
  },
  {
    cin: 'BB200002', nom: 'BENALI',    prenom: 'Fatima',    sexe: Sexe.F, dateNaissance: new Date('1992-09-30'),
    telephone: '0662-200002', groupeSanguin: 'O+',  mutuelle: 'CNOPS', medecinTraitant: 'Dr. Bennani',
    adresse: '7 Avenue Hassan II', ville: 'Rabat',
    allergies: [
      { substance: 'AINS',   reaction: 'Bronchospasme sévère', severite: 'severe',   confirmee: true  },
      { substance: 'Latex',  reaction: 'Urticaire de contact', severite: 'moderee',  confirmee: false },
    ],
    antecedents: [
      { type: 'medical',             description: 'Asthme bronchique allergique', dateDebut: new Date('2005-01-01'), actif: true },
      { type: 'medical',             description: 'Rhinite allergique saisonnière', actif: true },
      { type: 'traitement_habituel', description: 'Salbutamol inhalateur — à la demande', actif: true },
      { type: 'familial',            description: 'Père : asthme. Mère : dermatite atopique', actif: true },
    ],
    visites: [
      {
        triage: Triage.P1, motif: 'Crise d\'asthme aiguë grave, détresse respiratoire',
        statut: StatutVisite.TERMINE, orientation: Orientation.OBSERVATION_UHCD,
        diagnosticPrincipal: 'J46', diagnosticLibelle: 'État de mal asthmatique',
        triageAt: ago(2, 8), prisEnChargeAt: ago(2, 7), termineeAt: ago(2, 2), dureeMinutes: 360,
        constantes: [
          { releveAt: ago(2, 8), taSystolique: 138, taDiastolique: 82, fc: 125, spo2: 86, fr: 28, temperature: 37.8, eva: 8, poids: 58, taille: 162 },
          { releveAt: ago(2, 6), taSystolique: 130, taDiastolique: 78, fc: 115, spo2: 92, fr: 22, temperature: 37.6, eva: 6 },
          { releveAt: ago(2, 4), taSystolique: 122, taDiastolique: 76, fc: 98,  spo2: 96, fr: 18, temperature: 37.4, eva: 3 },
        ],
        soap: {
          subjectif: 'Patiente asthmatique connue, crise non contrôlée depuis 4h malgré 6 bouffées de Ventoline. Dyspnée intense, sibilants audibles, impossibilité de finir ses phrases.',
          objectif: 'SpO2 86% AA, FR 28/min. Wheezing diffus bilatéral. Tirage intercostal. Peak-flow < 33% théorique.',
          assessment: 'État de mal asthmatique. Facteur déclenchant : exposition pollinique.',
          plan: 'O2 haut débit, nébulisations Salbutamol + Ipratropium, Solumédrol 80mg IV, bilan gazométrique, surveillance en UHCD.',
          diagnosticCIM10: 'J46', diagnosticLibelle: 'État de mal asthmatique', isDraft: false,
        },
        bilans: [
          { code: 'GDS',  libelle: 'Gaz du sang artériel', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'pH 7.38, PaO2 62 mmHg ↓, PaCO2 36 mmHg', isCritique: true, resultatAt: ago(2, 7) },
          { code: 'NFS',  libelle: 'Numération Formule Sanguine', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'Hyperéosinophilie 0.9 G/L', isCritique: false, resultatAt: ago(2, 6) },
          { code: 'RX',   libelle: 'Radio Thorax', type: 'imagerie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'Distension thoracique bilatérale, pas de foyer', isCritique: false, resultatAt: ago(2, 6) },
        ],
        prescription: {
          isDraft: false,
          items: [
            { medId: '3400936819709', dose: '2.5 mg', frequence: 'Toutes les 4h', duree: '5 jours', voie: 'inhalation' },
            { medId: '3400936819707', dose: '20 mg',  frequence: '1×/j',          duree: '7 jours', voie: 'oral', instructions: 'À jeun le matin' },
          ],
        },
      },
    ],
  },
  {
    cin: 'CC300003', nom: 'TAZI',      prenom: 'Mohamed',   sexe: Sexe.M, dateNaissance: new Date('1957-11-03'),
    telephone: '0663-300003', groupeSanguin: 'B+',  mutuelle: 'Privée', medecinTraitant: 'Dr. Zerrouki',
    adresse: '23 Rue Moulay Ismail', ville: 'Fès',
    allergies: [],
    antecedents: [
      { type: 'medical',             description: 'Cardiopathie ischémique — pontage × 3 (2018)', dateDebut: new Date('2018-05-01'), actif: true },
      { type: 'medical',             description: 'Fibrillation auriculaire permanente', actif: true },
      { type: 'medical',             description: 'Insuffisance cardiaque FEVG 40%', actif: true },
      { type: 'traitement_habituel', description: 'Bisoprolol 5mg — 1×/j', actif: true },
      { type: 'traitement_habituel', description: 'Furosémide 40mg — 1×/j', actif: true },
      { type: 'traitement_habituel', description: 'Warfarine — INR cible 2-3', actif: true },
      { type: 'chirurgical',         description: 'Pontage aorto-coronarien triple (2018)', dateDebut: new Date('2018-05-15'), actif: true },
    ],
    visites: [
      {
        triage: Triage.P1, motif: 'Décompensation cardiaque aiguë — oedèmes membres inférieurs et dyspnée orthopnée',
        statut: StatutVisite.EN_COURS,
        triageAt: ago(0, 3), prisEnChargeAt: ago(0, 2),
        constantes: [
          { releveAt: ago(0, 3), taSystolique: 175, taDiastolique: 105, fc: 92, spo2: 89, fr: 26, temperature: 37.1, eva: 5, poids: 94, taille: 170, notes: 'Poids habituel 87 kg — gain de 7 kg en 1 semaine' },
          { releveAt: ago(0, 1), taSystolique: 168, taDiastolique: 100, fc: 88, spo2: 91, fr: 22, temperature: 37.0, eva: 4 },
        ],
        soap: null,
        bilans: [
          { code: 'BNP',   libelle: 'BNP (Brain Natriuretic Peptide)', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: '1240 pg/mL ↑↑', isCritique: true, resultatAt: ago(0, 1) },
          { code: 'CREAT', libelle: 'Créatininémie', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: '142 µmol/L ↑', isCritique: true, resultatAt: ago(0, 1) },
          { code: 'INR',   libelle: 'INR / TP', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'INR 1.4 (sous-thérapeutique)', isCritique: false, resultatAt: ago(0, 1) },
          { code: 'ECG',   libelle: 'ECG 12 dérivations', type: 'ecg', statut: StatutBilan.EN_ATTENTE_RESULTAT },
          { code: 'ECHO',  libelle: 'Échocardiographie urgente', type: 'imagerie', statut: StatutBilan.PRESCRIT },
        ],
        prescription: null,
      },
    ],
  },
  {
    cin: 'DD400004', nom: 'IDRISSI',   prenom: 'Omar',      sexe: Sexe.M, dateNaissance: new Date('1969-06-17'),
    telephone: '0664-400004', groupeSanguin: 'AB-', mutuelle: 'CNSS',  medecinTraitant: 'Dr. Cherkaoui',
    adresse: '45 Boulevard Zerktouni', ville: 'Casablanca',
    allergies: [
      { substance: 'Céphalosporines', reaction: 'Rash cutané maculo-papuleux', severite: 'moderee', confirmee: true },
    ],
    antecedents: [
      { type: 'medical',             description: 'BPCO stade III (GOLD 3)', dateDebut: new Date('2014-03-01'), actif: true },
      { type: 'medical',             description: 'Tabagisme actif 35 PA', actif: true },
      { type: 'traitement_habituel', description: 'Tiotropium 18µg — 1×/j', actif: true },
      { type: 'traitement_habituel', description: 'Fluticasone/Salmétérol inhalateur — 2×/j', actif: true },
    ],
    visites: [
      {
        triage: Triage.P2, motif: 'Exacerbation aiguë de BPCO — aggravation dyspnée et expectoration purulente',
        statut: StatutVisite.TERMINE, orientation: Orientation.HOSPITALISATION,
        diagnosticPrincipal: 'J44.1', diagnosticLibelle: 'BPCO avec exacerbation aiguë',
        triageAt: ago(10, 5), prisEnChargeAt: ago(10, 4), termineeAt: ago(10, 1), dureeMinutes: 240,
        constantes: [
          { releveAt: ago(10, 5), taSystolique: 145, taDiastolique: 88, fc: 110, spo2: 84, fr: 32, temperature: 38.9, eva: 6, poids: 68, taille: 172 },
          { releveAt: ago(10, 3), taSystolique: 140, taDiastolique: 85, fc: 100, spo2: 88, fr: 26, temperature: 38.6, eva: 5 },
        ],
        soap: {
          subjectif: 'Patient BPCO connu, aggravation progressive depuis 5 jours. Expectorations jaunes verdâtres, fièvre 38.9°C, dyspnée de repos. Tabagisme actif 35 paquets-années.',
          objectif: 'SpO2 84% AA, FR 32/min, température 38.9°C. Auscultation : ronchi diffus, tirage modéré. Cyanose péribuccale.',
          assessment: 'Exacerbation aiguë sévère de BPCO sur probable surinfection bactérienne.',
          plan: 'O2 contrôlé 28% (objectif SpO2 88-92%), nébulisations bronchodilatatrices, Amoxicilline-Acide clavulanique IV, corticothérapie systémique, kinésithérapie respiratoire. Hospitalisation.',
          diagnosticCIM10: 'J44.1', diagnosticLibelle: 'BPCO avec exacerbation aiguë', isDraft: false,
        },
        bilans: [
          { code: 'GDS',  libelle: 'Gaz du sang artériel', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'pH 7.32 ↓, PaO2 54 mmHg ↓↓, PaCO2 52 mmHg ↑', isCritique: true, resultatAt: ago(10, 4) },
          { code: 'NFS',  libelle: 'Numération Formule Sanguine', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'GB 16.8 G/L ↑, PNN 14.2 G/L', isCritique: false, resultatAt: ago(10, 4) },
          { code: 'CRP',  libelle: 'CRP', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: '124 mg/L ↑↑', isCritique: true, resultatAt: ago(10, 4) },
          { code: 'RX',   libelle: 'Radio Thorax', type: 'imagerie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'Distension emphysémateuse, opacité LID évocatrice de pneumonie', isCritique: false, resultatAt: ago(10, 3) },
        ],
        prescription: {
          isDraft: false,
          items: [
            { medId: '3400936819702', dose: '1 g',   frequence: '3×/j', duree: '7 jours', voie: 'IV' },
            { medId: '3400936819711', dose: '1 g',   frequence: '3×/j', duree: '5 jours', voie: 'oral' },
          ],
        },
      },
    ],
  },
  {
    cin: 'EE500005', nom: 'BENHADDOU', prenom: 'Zineb',     sexe: Sexe.F, dateNaissance: new Date('1983-02-28'),
    telephone: '0665-500005', groupeSanguin: 'A-',  mutuelle: 'Aucune', medecinTraitant: 'Dr. Lahlou',
    adresse: '8 Rue Imam Malik', ville: 'Meknès',
    allergies: [
      { substance: 'Carbamazépine', reaction: 'Syndrome de Stevens-Johnson', severite: 'severe', confirmee: true },
    ],
    antecedents: [
      { type: 'medical',             description: 'Épilepsie focale temporale gauche', dateDebut: new Date('2008-09-01'), actif: true },
      { type: 'traitement_habituel', description: 'Valproate de sodium 500mg — 2×/j', actif: true },
      { type: 'chirurgical',         description: 'Appendicectomie laparoscopique (2012)', dateDebut: new Date('2012-07-20'), actif: true },
    ],
    visites: [
      {
        triage: Triage.P1, motif: 'Crise convulsive généralisée tonico-clonique — durée > 5 min',
        statut: StatutVisite.TERMINE, orientation: Orientation.HOSPITALISATION,
        diagnosticPrincipal: 'G41.0', diagnosticLibelle: 'État de mal épileptique tonico-clonique généralisé',
        triageAt: ago(7, 6), prisEnChargeAt: ago(7, 5), termineeAt: ago(7, 1), dureeMinutes: 290,
        constantes: [
          { releveAt: ago(7, 6), taSystolique: 148, taDiastolique: 90, fc: 130, spo2: 91, fr: 22, temperature: 38.2, glasgow: 9, poids: 65, taille: 168 },
          { releveAt: ago(7, 4), taSystolique: 132, taDiastolique: 82, fc: 110, spo2: 96, fr: 18, temperature: 37.9, glasgow: 13 },
        ],
        soap: {
          subjectif: 'Patiente épileptique connue, retrouvée inconsciente par sa famille avec mouvements tonico-cloniques. Crise > 5 minutes. Dernier taux valproate non vérifié.',
          objectif: 'GCS 9/15 à l\'arrivée. Morsure latérale de langue. SpO2 91% AA. Post-critique à l\'admission.',
          assessment: 'État de mal épileptique. Probable oubli de traitement (Valproate). Éliminer une cause organique sous-jacente.',
          plan: 'Diazépam IV 10mg, puis Phénytoine si persistance. Taux valproatémie. TDM cérébral. Surveillance neurologique. Hospitalisation en neurologie.',
          diagnosticCIM10: 'G41.0', diagnosticLibelle: 'État de mal épileptique', isDraft: false,
        },
        bilans: [
          { code: 'VALP', libelle: 'Valproatémie', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: '28 mg/L (zone thérapeutique 50-100 mg/L) ↓↓', isCritique: true, resultatAt: ago(7, 4) },
          { code: 'NFS',  libelle: 'NFS', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'Normal', isCritique: false, resultatAt: ago(7, 4) },
          { code: 'IONO', libelle: 'Ionogramme sanguin', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'Na 136 mEq/L, K 4.1 mEq/L, Glycémie 5.8 mmol/L', isCritique: false, resultatAt: ago(7, 4) },
          { code: 'TDM',  libelle: 'TDM cérébral sans injection', type: 'imagerie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'Pas de lésion expansive, pas d\'AVC aigu', isCritique: false, resultatAt: ago(7, 3) },
        ],
        prescription: { isDraft: false, items: [] },
      },
    ],
  },
  {
    cin: 'FF600006', nom: 'OUALI',     prenom: 'Hamid',     sexe: Sexe.M, dateNaissance: new Date('1951-12-01'),
    telephone: '0666-600006', groupeSanguin: 'O-',  mutuelle: 'CNSS',  medecinTraitant: 'Dr. Benkirane',
    adresse: '102 Avenue Mohammed V', ville: 'Marrakech',
    allergies: [],
    antecedents: [
      { type: 'medical',             description: 'Insuffisance rénale chronique stade 4 (DFG 22 mL/min)', dateDebut: new Date('2016-01-01'), actif: true },
      { type: 'medical',             description: 'HTA sévère sous trithérapie', actif: true },
      { type: 'medical',             description: 'Anémie normochrome normocytaire', actif: true },
      { type: 'traitement_habituel', description: 'Érythropoïétine SC — 1×/semaine', actif: true },
      { type: 'traitement_habituel', description: 'Phosphate de calcium — 3×/j pendant les repas', actif: true },
      { type: 'traitement_habituel', description: 'Furosémide 80mg — 2×/j', actif: true },
    ],
    visites: [
      {
        triage: Triage.P2, motif: 'Oedèmes des membres inférieurs, dyspnée — aggravation IRC',
        statut: StatutVisite.EN_ATTENTE,
        triageAt: ago(0, 1),
        constantes: [
          { releveAt: ago(0, 1), taSystolique: 188, taDiastolique: 112, fc: 88, spo2: 93, fr: 20, temperature: 36.8, poids: 88, taille: 168, notes: 'Poids sec habituel 80 kg' },
        ],
        soap: null,
        bilans: [
          { code: 'CREAT', libelle: 'Créatininémie + DFG', type: 'biologie', statut: StatutBilan.EN_ATTENTE_RESULTAT },
          { code: 'IONO',  libelle: 'Ionogramme + Urée', type: 'biologie', statut: StatutBilan.EN_ATTENTE_RESULTAT },
          { code: 'NFS',   libelle: 'NFS', type: 'biologie', statut: StatutBilan.PRESCRIT },
        ],
        prescription: null,
      },
    ],
  },
  {
    cin: 'GG700007', nom: 'SAIDI',     prenom: 'Laila',     sexe: Sexe.F, dateNaissance: new Date('2005-08-14'),
    telephone: '0667-700007', groupeSanguin: 'B-',  mutuelle: 'Aucune',
    adresse: '33 Rue Al Mansour', ville: 'Agadir',
    allergies: [],
    antecedents: [
      { type: 'medical', description: 'Pas d\'antécédent notable', actif: true },
    ],
    visites: [
      {
        triage: Triage.P3, motif: 'Traumatisme du poignet droit suite à une chute — douleur et déformation',
        statut: StatutVisite.TERMINE, orientation: Orientation.SORTIE_DOMICILE,
        diagnosticPrincipal: 'S52.5', diagnosticLibelle: 'Fracture de l\'extrémité inférieure du radius (Pouteau-Colles)',
        triageAt: ago(3, 4), prisEnChargeAt: ago(3, 3), termineeAt: ago(3, 1), dureeMinutes: 130,
        constantes: [
          { releveAt: ago(3, 4), taSystolique: 118, taDiastolique: 72, fc: 88, spo2: 99, temperature: 37.0, eva: 7, poids: 52, taille: 165 },
        ],
        soap: {
          subjectif: 'Jeune patiente de 19 ans, chute sur la main en hyperextension lors d\'une randonnée. Douleur intense poignet droit, gonflement visible, déformation en dos de fourchette.',
          objectif: 'Déformation typique en dos de fourchette du poignet droit. Mobilisation impossible. Pouls radial présent, sensibilité médiane intacte. EVA 7/10.',
          assessment: 'Fracture de Pouteau-Colles du radius droit confirmée sur RX.',
          plan: 'Antalgiques, réduction sous anesthésie locale, immobilisation plâtre brachio-antébrachial 45 jours. Consultation orthopédie J+3.',
          diagnosticCIM10: 'S52.5', diagnosticLibelle: 'Fracture Pouteau-Colles', isDraft: false,
        },
        bilans: [
          { code: 'RX_POIG', libelle: 'Radio Poignet droit F+P', type: 'imagerie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'Fracture comminutive extrémité inférieure radius droit avec bascule postérieure', isCritique: false, resultatAt: ago(3, 3) },
        ],
        prescription: {
          isDraft: false,
          items: [
            { medId: '3400936819703', dose: '1 g',   frequence: '3×/j', duree: '5 jours', voie: 'oral' },
            { medId: '3400936819707', dose: '20 mg', frequence: '1×/j', duree: '5 jours', voie: 'oral', instructions: 'Protection gastrique pendant les AINS' },
          ],
        },
      },
    ],
  },
  {
    cin: 'HH800008', nom: 'MANSOURI',  prenom: 'Khalid',    sexe: Sexe.M, dateNaissance: new Date('1988-05-22'),
    telephone: '0668-800008', groupeSanguin: 'A+',  mutuelle: 'CNOPS',
    adresse: '56 Rue Ibn Khaldoun', ville: 'Oujda',
    allergies: [],
    antecedents: [
      { type: 'medical', description: 'Pas d\'antécédent médical significatif', actif: true },
    ],
    visites: [
      {
        triage: Triage.P2, motif: 'Douleur fosse iliaque droite intense, fièvre, défense abdominale',
        statut: StatutVisite.TERMINE, orientation: Orientation.HOSPITALISATION,
        diagnosticPrincipal: 'K35.8', diagnosticLibelle: 'Appendicite aiguë avec péritonite localisée',
        triageAt: ago(1, 10), prisEnChargeAt: ago(1, 9), termineeAt: ago(1, 5), dureeMinutes: 240,
        constantes: [
          { releveAt: ago(1, 10), taSystolique: 128, taDiastolique: 78, fc: 108, spo2: 99, temperature: 38.8, eva: 9, poids: 75, taille: 178 },
        ],
        soap: {
          subjectif: 'Patient de 36 ans, douleur migratrice débuta péri-ombilicale il y a 18h, localisée maintenant en FID. Nausées, vomissements, anorexie. Fièvre à 38.8°C.',
          objectif: 'Défense localisée FID. Signe de Blumberg +. Point de McBurney très douloureux. Contracture abdominale débutante. Fièvre 38.8°C.',
          assessment: 'Appendicite aiguë compliquée (péritonite localisée). Score d\'Alvarado = 9/10.',
          plan: 'Chirurgie en urgence : appendicectomie laparoscopique. Antibioprophylaxie péri-opératoire. Mise à jeun. Bilan préopératoire.',
          diagnosticCIM10: 'K35.8', diagnosticLibelle: 'Appendicite aiguë avec péritonite localisée', isDraft: false,
        },
        bilans: [
          { code: 'NFS',  libelle: 'NFS', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'GB 16.4 G/L ↑, PNN 14.1 G/L', isCritique: true, resultatAt: ago(1, 9) },
          { code: 'CRP',  libelle: 'CRP', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: '89 mg/L ↑', isCritique: false, resultatAt: ago(1, 9) },
          { code: 'ECHO', libelle: 'Échographie abdominale', type: 'imagerie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'Appendice non compressible ∅ 9mm, épanchement FID, stercolithe', isCritique: true, resultatAt: ago(1, 8) },
          { code: 'GS',   libelle: 'Groupe sanguin RAI', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'A+ RAI négatif', isCritique: false, resultatAt: ago(1, 8) },
        ],
        prescription: { isDraft: false, items: [] },
      },
    ],
  },
  {
    cin: 'II900009', nom: 'ALAOUI',    prenom: 'Meryem',    sexe: Sexe.F, dateNaissance: new Date('1962-03-07'),
    telephone: '0669-900009', groupeSanguin: 'AB+', mutuelle: 'Privée', medecinTraitant: 'Dr. Filali',
    adresse: '14 Rue Riad Zitoun', ville: 'Marrakech',
    allergies: [
      { substance: 'Aspirine', reaction: 'Épigastralgies, saignement digestif', severite: 'moderee', confirmee: true },
    ],
    antecedents: [
      { type: 'medical',             description: 'HTA traitée depuis 2010', dateDebut: new Date('2010-01-01'), actif: true },
      { type: 'medical',             description: 'Fibrillation auriculaire paroxystique', actif: true },
      { type: 'traitement_habituel', description: 'Rivaroxaban 20mg — 1×/j', actif: true },
      { type: 'traitement_habituel', description: 'Ramipril 10mg — 1×/j', actif: true },
    ],
    visites: [
      {
        triage: Triage.P1, motif: 'Déficit neurologique brutal hémicorps gauche — suspicion AVC',
        statut: StatutVisite.TERMINE, orientation: Orientation.HOSPITALISATION,
        diagnosticPrincipal: 'I63.3', diagnosticLibelle: 'Infarctus cérébral par occlusion artères cérébrales moyennes',
        triageAt: ago(15, 8), prisEnChargeAt: ago(15, 7), termineeAt: ago(15, 4), dureeMinutes: 240,
        constantes: [
          { releveAt: ago(15, 8), taSystolique: 195, taDiastolique: 110, fc: 95, spo2: 97, fr: 18, temperature: 37.3, glasgow: 13, poids: 72, taille: 163 },
          { releveAt: ago(15, 6), taSystolique: 182, taDiastolique: 104, fc: 90, spo2: 98, fr: 16, temperature: 37.2, glasgow: 14 },
        ],
        soap: {
          subjectif: 'Patiente de 62 ans, début brutal il y a 1h30. Déficit moteur hémicorps gauche, déviation de la commissure labiale, dysarthrie. Conjointe alerte le SAMU.',
          objectif: 'NIHSS 12. Hémiparésie gauche proportionnelle. Paralysie faciale centrale gauche. TA 195/110. GCS 13. Score FAST : 3/3.',
          assessment: 'AVC ischémique hémisphérique droit probable. Contre-indication thrombolyse (Rivaroxaban récent). Fenêtre thérapeutique : 1h30.',
          plan: 'Activation filière neurovasculaire urgente. IRM cérébrale en urgence, angio-IRM. Anti-HTA prudent (objectif TA < 185/110 si thrombolyse possible). Thrombectomie mécanique discutée.',
          diagnosticCIM10: 'I63.3', diagnosticLibelle: 'AVC ischémique sylvien droit', isDraft: false,
        },
        bilans: [
          { code: 'IRM',  libelle: 'IRM cérébrale DWI + FLAIR + Angio', type: 'imagerie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'Hypersignal DWI sylvien droit M1-M2. Occlusion ACM droite confirmée en angio', isCritique: true, resultatAt: ago(15, 6) },
          { code: 'NFS',  libelle: 'NFS + Hémostase', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'Anti-Xa 0.18 UI/mL (Rivaroxaban actif)', isCritique: true, resultatAt: ago(15, 7) },
          { code: 'IONO', libelle: 'Ionogramme + Glycémie', type: 'biologie', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'Glycémie 8.2 mmol/L, Na 138, K 4.0', isCritique: false, resultatAt: ago(15, 7) },
          { code: 'ECG',  libelle: 'ECG', type: 'ecg', statut: StatutBilan.RESULTAT_DISPONIBLE, resultat: 'Fibrillation auriculaire à 95 bpm, pas de trouble de repolarisation', isCritique: false, resultatAt: ago(15, 7) },
        ],
        prescription: { isDraft: false, items: [] },
      },
    ],
  },
  {
    cin: 'JJ000010', nom: 'CHRAIBI',   prenom: 'Nadia',     sexe: Sexe.F, dateNaissance: new Date('1995-07-19'),
    telephone: '0660-000010', groupeSanguin: 'O+',  mutuelle: 'CNOPS',
    adresse: '9 Rue Sebou', ville: 'Kénitra',
    allergies: [],
    antecedents: [
      { type: 'medical', description: 'Migraine avec aura depuis l\'adolescence', actif: true },
      { type: 'traitement_habituel', description: 'Sumatriptan 50mg — au besoin en crise', actif: true },
    ],
    visites: [
      {
        triage: Triage.P3, motif: 'Céphalées intenses pulsatiles, photophobie, vomissements — crise migraineuse',
        statut: StatutVisite.TERMINE, orientation: Orientation.SORTIE_DOMICILE,
        diagnosticPrincipal: 'G43.1', diagnosticLibelle: 'Migraine avec aura',
        triageAt: ago(4, 2), prisEnChargeAt: ago(4, 1), termineeAt: ago(4, 0), dureeMinutes: 90,
        constantes: [
          { releveAt: ago(4, 2), taSystolique: 125, taDiastolique: 78, fc: 72, spo2: 99, temperature: 36.9, eva: 9, poids: 60, taille: 167 },
        ],
        soap: {
          subjectif: 'Patiente migraineuse connue, crise sévère depuis 6h. Aura visuelle (scotome scintillant) puis céphalée pulsatile hémicrânienne droite, photophobie, phonophobie, nausées et vomissements. Sumatriptan inefficace cette fois.',
          objectif: 'Examen neurologique normal. Raideur méningée absente. Fond d\'œil normal. Pas de fièvre. TA 125/78.',
          assessment: 'Crise migraineuse sévère réfractaire au traitement habituel. Pas de signe d\'alarme nécessitant imagerie urgente.',
          plan: 'Mise au repos en chambre noire. Métoclopramide IV 10mg, Kétoprofène IV 100mg. Réévaluation à 1h. Si amélioration : sortie avec ordonnance.',
          diagnosticCIM10: 'G43.1', diagnosticLibelle: 'Migraine avec aura', isDraft: false,
        },
        bilans: [],
        prescription: {
          isDraft: false,
          items: [
            { medId: '3400936819703', dose: '1 g',   frequence: '3×/j', duree: '3 jours', voie: 'oral' },
            { medId: '3400936819707', dose: '20 mg', frequence: '1×/j', duree: '3 jours', voie: 'oral', instructions: 'Protection gastrique' },
          ],
        },
      },
      {
        triage: Triage.P4, motif: 'Contrôle post-urgence — suivi céphalées récidivantes',
        statut: StatutVisite.TERMINE, orientation: Orientation.SORTIE_DOMICILE,
        diagnosticPrincipal: 'G43.9', diagnosticLibelle: 'Migraine sans précision',
        triageAt: ago(30, 0), prisEnChargeAt: ago(30, 0), termineeAt: ago(30, 0), dureeMinutes: 45,
        constantes: [
          { releveAt: ago(30, 0), taSystolique: 118, taDiastolique: 74, fc: 68, spo2: 99, temperature: 36.7, eva: 3, poids: 60, taille: 167 },
        ],
        soap: {
          subjectif: 'Patiente de retour pour suivi. Crises toujours fréquentes (4-5/mois). Demande un traitement de fond.',
          objectif: 'Examen neurologique normal. Tension artérielle normale.',
          assessment: 'Migraine fréquente invalidante. Indication d\'un traitement prophylactique.',
          plan: 'Introduction Propranolol 40mg 1×/j, titration progressive. Tenir un agenda des crises. Consultation neurologie programmée.',
          diagnosticCIM10: 'G43.9', diagnosticLibelle: 'Migraine chronique', isDraft: false,
        },
        bilans: [],
        prescription: {
          isDraft: false,
          items: [
            { medId: '3400936819704', dose: '40 mg', frequence: '1×/j le soir', duree: '3 mois', voie: 'oral', instructions: 'Ne pas arrêter brutalement' },
          ],
        },
      },
    ],
  },
]

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seed données de démonstration USS-I...\n')

  // ── 1. Boxes ─────────────────────────────────────────────────
  const boxCount = await prisma.box.count()
  if (boxCount === 0) {
    await prisma.box.createMany({
      data: [
        { numero: 1, nom: 'Box 1',         type: 'standard'    },
        { numero: 2, nom: 'Box 2',         type: 'standard'    },
        { numero: 3, nom: 'Box 3',         type: 'standard'    },
        { numero: 4, nom: 'Box Réa',       type: 'reanimation' },
        { numero: 5, nom: 'Box Plâtre',    type: 'platre'      },
        { numero: 6, nom: 'Box Isolement', type: 'isolement'   },
      ],
    })
    console.log('  ✅ Boxes créés')
  }

  // ── 2. Médicaments de référence ──────────────────────────────
  for (const med of MEDS) {
    await prisma.medicament.upsert({
      where:  { id: med.id },
      update: {},
      create: { ...med, type: 'P', tauxRemboursement: 70, actif: true },
    })
  }
  console.log('  ✅ Médicaments de référence créés\n')

  // ── 3. Patients + données cliniques ─────────────────────────
  for (const p of PATIENTS_DATA) {
    const { allergies, antecedents, visites: visitesData, ...patientFields } = p

    // Patient
    const patient = await prisma.patient.upsert({
      where:  { cin: patientFields.cin! },
      update: {},
      create: patientFields,
    })

    // Allergies
    for (const a of allergies) {
      await prisma.allergie.create({ data: { patientId: patient.id, ...a } })
    }

    // Antécédents
    for (const ant of antecedents) {
      await prisma.antecedent.create({ data: { patientId: patient.id, ...ant } })
    }

    // Visites
    for (const v of visitesData) {
      const { constantes, soap, bilans, prescription, ...visiteFields } = v

      const visite = await prisma.visite.create({
        data: { patientId: patient.id, ...visiteFields },
      })

      // Constantes vitales
      for (const c of constantes) {
        await prisma.constantesVitales.create({ data: { visiteId: visite.id, ...c } })
      }

      // Consultation SOAP (on a besoin d'un userId fictif — on cherche le premier user dispo)
      if (soap) {
        const medecin = await prisma.user.findFirst()
        if (medecin) {
          const { isDraft, ...soapFields } = soap
          await prisma.consultation.create({
            data: {
              visiteId:   visite.id,
              medecinId:  medecin.id,
              isDraft,
              finaliseeAt: isDraft ? null : new Date(),
              ...soapFields,
            },
          })
        }
      }

      // Bilans
      for (const b of bilans) {
        await prisma.bilan.create({ data: { visiteId: visite.id, ...b } })
      }

      // Prescription + items
      if (prescription) {
        const presc = await prisma.prescription.create({
          data: {
            visiteId:  visite.id,
            isDraft:   prescription.isDraft,
            valideeAt: prescription.isDraft ? null : new Date(),
          },
        })
        for (const item of prescription.items) {
          const { medId, ...itemFields } = item
          await prisma.prescriptionItem.create({
            data: { prescriptionId: presc.id, medicamentId: medId, ...itemFields },
          })
        }
      }
    }

    const nbVisites = visitesData.length
    console.log(`  ✅ ${patient.prenom} ${patient.nom} — ${nbVisites} visite(s)`)
  }

  console.log('\n🎉 Seed terminé ! 10 patients avec données cliniques complètes.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
