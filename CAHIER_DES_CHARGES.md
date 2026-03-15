# Cahier des Charges — Urgentist CRM
## Application Web de Gestion de Patients pour Médecin Urgentiste

**Version :** 1.0 — À confirmer
**Date :** 15 mars 2026
**Statut :** En attente de validation

---

## 1. CONTEXTE ET OBJECTIF

### 1.1 Contexte
Un médecin urgentiste a besoin d'un outil numérique centralisé pour gérer l'ensemble de ses patients de manière efficace, rapide et sécurisée. Contrairement à un CRM générique, cet outil est conçu spécifiquement pour le flux de travail d'un médecin urgentiste : triage rapide, suivi des consultations, gestion des priorités médicales et historique patient.

### 1.2 Références / Inspirations
Les meilleures solutions du marché analysées :
- **Medesk** — CRM médical avec agenda et dossier patient électronique
- **Doctoralia** — Gestion des rendez-vous et profils patients
- **Cliniko** — Notes cliniques rapides et gestion de flux
- **Jane App** — Interface fluide pour praticiens indépendants
- **Healthie** — Suivi patient axé sur la continuité des soins

---

## 2. UTILISATEURS CIBLES

| Rôle | Description |
|------|-------------|
| **Médecin urgentiste** | Utilisateur principal — accès complet |
| **Secrétaire médicale** *(optionnel, phase 2)* | Saisie administrative, prise de RDV |

---

## 3. FONCTIONNALITÉS PRINCIPALES

### 3.1 Tableau de Bord (Dashboard)
- Vue en temps réel de la liste des patients en attente / en cours / traités
- Compteurs : patients vus aujourd'hui, consultations en attente, urgences actives
- Alertes visuelles par niveau de priorité (triage)
- Accès rapide aux dernières fiches consultées

### 3.2 Gestion des Patients (Fiche Patient)
Chaque patient dispose d'une fiche complète :

**Informations administratives :**
- Nom, prénom, date de naissance, sexe
- Numéro de sécurité sociale / carte vitale
- Coordonnées (téléphone, adresse)
- Contact urgence (nom + téléphone)
- Médecin traitant référent

**Informations médicales :**
- Antécédents médicaux et chirurgicaux
- Allergies et contre-indications
- Traitements en cours (médicaments, posologie)
- Groupe sanguin
- Pathologies chroniques

**Historique :**
- Liste chronologique de toutes les consultations
- Documents joints (ordonnances, résultats d'analyses, imagerie)
- Notes libres du médecin

### 3.3 Gestion des Consultations
- Création rapide d'une nouvelle consultation (en moins de 3 clics)
- Motif de consultation
- Niveau de triage / urgence : P1 (critique), P2 (urgent), P3 (semi-urgent), P4 (non-urgent)
- Heure d'arrivée, heure de prise en charge, heure de sortie
- Examen clinique (champs structurés + zone de texte libre)
- Diagnostic (CIM-10 avec autocomplétion)
- Plan de traitement et prescription
- Orientation en sortie : retour à domicile / hospitalisation / transfert / SAMU

### 3.4 Système de Triage & Priorités
- Code couleur inspiré du système ESI (Emergency Severity Index) :
  - 🔴 Rouge — Immédiat (P1)
  - 🟠 Orange — Très urgent (P2)
  - 🟡 Jaune — Urgent (P3)
  - 🟢 Vert — Non urgent (P4)
  - ⚫ Noir — Décédé / non réanimable
- File d'attente dynamique avec réordonnancement selon priorité
- Timer visible par patient depuis son arrivée

### 3.5 Prescriptions & Ordonnances
- Générateur d'ordonnances numériques
- Bibliothèque de médicaments (base Vidal ou équivalent)
- Historique des prescriptions par patient
- Export PDF imprimable et signable

### 3.6 Recherche & Filtres
- Recherche globale par nom, prénom, date de naissance, numéro SS
- Filtres : par date, par priorité, par statut, par diagnostic
- Historique des patients récents

### 3.7 Statistiques & Rapports (phase 2)
- Nombre de consultations par période
- Répartition par niveau de triage
- Diagnostics les plus fréquents
- Temps moyen de prise en charge
- Export Excel / PDF

---

## 4. CONTRAINTES TECHNIQUES

### 4.1 Stack Technique Proposée
| Composant | Technologie |
|-----------|-------------|
| Frontend | React + TypeScript |
| UI Components | Tailwind CSS + shadcn/ui |
| Backend | Node.js / Express ou Next.js (API Routes) |
| Base de données | PostgreSQL (données structurées) |
| Auth | NextAuth.js ou JWT |
| Hébergement | Vercel / Railway / VPS dédié |
| Stockage fichiers | S3 compatible (Cloudflare R2 ou AWS S3) |

### 4.2 Sécurité & Conformité
- Chiffrement des données au repos et en transit (HTTPS, AES-256)
- Authentification à deux facteurs (2FA)
- Conformité **RGPD** (droit à l'effacement, export des données)
- Conformité **HDS** (Hébergeur de Données de Santé) — certification requise pour la production
- Journalisation des accès (audit log)
- Sauvegarde automatique quotidienne

### 4.3 Performances
- Temps de chargement < 2 secondes
- Application responsive (PC, tablette — usage principal sur écran large)
- Mode hors-ligne partiel (consultation des fiches récentes)

---

## 5. INTERFACE UTILISATEUR

### 5.1 Principes UX
- **Rapidité avant tout** : actions courantes accessibles en maximum 3 clics
- Interface épurée, pas de surcharge visuelle
- Mode sombre disponible (pour les urgences de nuit)
- Navigation latérale fixe avec accès direct aux sections principales

### 5.2 Navigation Principale
```
├── 🏠 Dashboard
├── 🚨 File d'attente (triage)
├── 👥 Patients (liste + recherche)
├── 📋 Consultations
├── 💊 Prescriptions
├── 📊 Statistiques (phase 2)
└── ⚙️  Paramètres
```

### 5.3 Palette & Design
- Couleurs professionnelles et médicales : blanc, bleu médical, gris anthracite
- Typographie lisible, tailles confortables (fatigue visuelle réduite)
- Icônes claires et universelles

---

## 6. PHASES DE DÉVELOPPEMENT

### Phase 1 — MVP (Minimum Viable Product)
**Durée estimée : 4 à 6 semaines**

- [ ] Authentification (login sécurisé)
- [ ] Fiche patient (création, édition, consultation)
- [ ] Gestion des consultations avec triage
- [ ] File d'attente en temps réel
- [ ] Recherche patient
- [ ] Dashboard basique
- [ ] Export ordonnance PDF

### Phase 2 — Enrichissement
**Durée estimée : 3 à 4 semaines supplémentaires**

- [ ] Statistiques et rapports
- [ ] Gestion des documents / imagerie
- [ ] Notifications (rappels, alertes)
- [ ] Rôle secrétaire médicale
- [ ] Application mobile légère (PWA)

---

## 7. QUESTIONS EN ATTENTE DE VALIDATION

Avant de démarrer le développement, les points suivants doivent être confirmés par le médecin :

1. **Utilisateurs** : L'application sera-t-elle utilisée par un seul médecin ou par une équipe ?
2. **Hébergement** : Préférence pour un hébergement cloud (SaaS) ou serveur local (on-premise) ?
3. **Données existantes** : Y a-t-il des données patients à migrer depuis un autre système ?
4. **Intégrations** : Besoin de connexion avec des systèmes tiers ? (DMP, Doctolib, laboratoires...)
5. **Ordonnances** : Besoin de signature électronique certifiée ?
6. **Facturation** : L'application doit-elle gérer la facturation / cotation des actes (CCAM) ?
7. **Accès mobile** : Utilisation prévue sur smartphone (iOS/Android) ?
8. **Langue** : Interface en français uniquement ou multilingue ?

---

## 8. CRITÈRES DE SUCCÈS

- Le médecin peut créer une fiche patient complète en moins de 2 minutes
- La file d'attente de triage est visible et mise à jour instantanément
- L'historique complet d'un patient est accessible en 1 clic
- Aucune perte de données en cas de coupure réseau
- Le système est utilisable sans formation de plus de 30 minutes

---

## VALIDATION

> **Ce cahier des charges est soumis à validation.**
> Merci de confirmer chaque section ou d'indiquer les modifications souhaitées.

| Section | Statut | Commentaires |
|---------|--------|--------------|
| Fonctionnalités principales | ⏳ En attente | |
| Stack technique | ⏳ En attente | |
| Phases de développement | ⏳ En attente | |
| Questions ouvertes | ⏳ En attente | |
