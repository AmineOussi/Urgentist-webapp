# Cahier des Charges — Urgentist CRM
## Application Web de Gestion de Patients pour Médecin Urgentiste

**Version :** 1.1 — Validé
**Date :** 15 mars 2026
**Statut :** APPROUVÉ — Prêt pour développement

---

## 1. CONTEXTE ET OBJECTIF

### 1.1 Contexte
Un médecin urgentiste (usage solo) a besoin d'un outil numérique cloud centralisé pour gérer l'ensemble de ses patients de manière efficace, rapide et sécurisée. Cet outil est conçu spécifiquement pour le flux de travail d'un urgentiste : triage rapide, suivi des consultations, gestion des priorités médicales, historique patient et facturation des actes.

### 1.2 Références / Inspirations
Les meilleures solutions du marché analysées :
- **Medesk** — CRM médical avec agenda et dossier patient électronique
- **Doctoralia** — Gestion des rendez-vous et profils patients
- **Cliniko** — Notes cliniques rapides et gestion de flux
- **Jane App** — Interface fluide pour praticiens indépendants
- **Healthie** — Suivi patient axé sur la continuité des soins

---

## 2. UTILISATEURS & DÉPLOIEMENT

| Paramètre | Décision |
|-----------|----------|
| **Utilisateur** | Médecin urgentiste seul (compte unique) |
| **Hébergement** | Cloud (SaaS) |
| **Migration** | Aucune donnée existante à migrer |
| **Intégrations tierces** | Aucune en phase 1 et 2 *(Doctolib, DMP, labos reportés en phase 3 optionnelle)* |
| **Signature électronique** | Non requise |
| **Facturation** | Incluse (cotation actes CCAM) |
| **Appareils** | PC, tablette, smartphone (responsive obligatoire) |
| **Langue** | Français uniquement (v1) |

---

## 3. FONCTIONNALITÉS PRINCIPALES

### 3.1 Tableau de Bord (Dashboard)
- Vue en temps réel : patients en attente / en cours / traités aujourd'hui
- Compteurs : patients vus aujourd'hui, urgences actives, actes à facturer
- Alertes visuelles par niveau de priorité (triage)
- Accès rapide aux dernières fiches consultées
- Résumé financier du jour (actes facturés / en attente)

### 3.2 Gestion des Patients (Fiche Patient)
Chaque patient dispose d'une fiche complète :

**Informations administratives :**
- Nom, prénom, date de naissance, sexe
- Numéro de sécurité sociale / carte vitale
- Coordonnées (téléphone, adresse)
- Contact urgence (nom + téléphone)
- Médecin traitant référent
- Mutuelle / organisme complémentaire

**Informations médicales :**
- Antécédents médicaux et chirurgicaux
- Allergies et contre-indications (affichage en alerte visuelle rouge)
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
- Lien direct vers la facturation de l'acte

### 3.4 Système de Triage & Priorités
- Code couleur inspiré du système ESI (Emergency Severity Index) :
  - Rouge — Immédiat (P1)
  - Orange — Très urgent (P2)
  - Jaune — Urgent (P3)
  - Vert — Non urgent (P4)
  - Noir — Décédé / non réanimable
- File d'attente dynamique avec réordonnancement selon priorité
- Timer visible par patient depuis son arrivée

### 3.5 Prescriptions & Ordonnances
- Générateur d'ordonnances numériques (sans signature électronique certifiée)
- Bibliothèque de médicaments avec autocomplétion
- Historique des prescriptions par patient
- Export / impression PDF

### 3.6 Facturation & Cotation CCAM
- Saisie des actes médicaux avec codes CCAM
- Cotation automatique des actes courants (consultations, soins d'urgence)
- Gestion des modes de paiement : carte vitale, mutuelle, espèces, CB
- Statuts de facturation : en attente / facturé / payé / impayé
- Génération de feuilles de soins (papier)
- Tableau de bord financier : recettes du jour, de la semaine, du mois
- Export comptable (CSV / PDF)

### 3.7 Recherche & Filtres
- Recherche globale par nom, prénom, date de naissance, numéro SS
- Filtres : par date, par priorité, par statut, par diagnostic
- Historique des patients récents

### 3.8 Statistiques & Rapports (Phase 2)
- Nombre de consultations par période
- Répartition par niveau de triage
- Diagnostics les plus fréquents
- Temps moyen de prise en charge
- Rapports financiers détaillés
- Export Excel / PDF

---

## 4. CONTRAINTES TECHNIQUES

### 4.1 Stack Technique
| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 14 + TypeScript |
| UI Components | Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes |
| Base de données | PostgreSQL (via Supabase ou Railway) |
| Auth | NextAuth.js (email + mot de passe + 2FA) |
| Hébergement | Vercel (frontend) + Railway/Supabase (BDD) |
| Stockage fichiers | Cloudflare R2 ou Supabase Storage |
| PDF | react-pdf / puppeteer |

### 4.2 Sécurité & Conformité
- Chiffrement des données au repos et en transit (HTTPS, AES-256)
- Authentification à deux facteurs (2FA) obligatoire
- Conformité **RGPD** (droit à l'effacement, export des données)
- Conformité **HDS** (Hébergeur de Données de Santé) — à viser pour la mise en production
- Journalisation des accès (audit log)
- Sauvegarde automatique quotidienne
- Session avec timeout automatique (inactivité > 30 min)

### 4.3 Responsive & Appareils
- **PC (bureau)** — interface complète, navigation latérale fixe
- **Tablette** — interface adaptée, navigation en onglets
- **Smartphone** — interface simplifiée, actions rapides prioritaires (triage, fiche patient)
- Progressive Web App (PWA) : installable sur mobile, accès hors-ligne partiel

### 4.4 Performances
- Temps de chargement < 2 secondes
- Recherche patient instantanée (< 200ms)
- Mode hors-ligne partiel : consultation des 20 dernières fiches

---

## 5. INTERFACE UTILISATEUR

### 5.1 Principes UX
- **Rapidité avant tout** : actions courantes accessibles en maximum 3 clics
- Interface épurée, pas de surcharge visuelle
- Mode sombre disponible (urgences de nuit)
- Allergies et alertes médicales toujours visibles en rouge sur la fiche
- Navigation responsive adaptée à chaque appareil

### 5.2 Navigation Principale
```
PC / Tablette (sidebar)         Mobile (bottom nav)
├── Dashboard                   ├── Dashboard
├── File d'attente (triage)     ├── Triage
├── Patients                    ├── Patients
├── Consultations               ├── + (action rapide)
├── Prescriptions               └── Menu
├── Facturation
├── Statistiques (phase 2)
└── Paramètres
```

### 5.3 Palette & Design
- Couleurs : blanc, bleu médical (#1E6FBF), gris anthracite, rouge urgence
- Typographie lisible et confortable (Inter ou Roboto)
- Icônes claires et universelles (Lucide Icons)
- Codes couleurs de triage constants dans toute l'application

---

## 6. PHASES DE DÉVELOPPEMENT

### Phase 1 — MVP
- [ ] Authentification sécurisée (login + 2FA)
- [ ] Fiche patient complète (création, édition, consultation)
- [ ] File d'attente avec système de triage
- [ ] Gestion des consultations
- [ ] Prescriptions + export PDF
- [ ] Facturation basique (actes CCAM, feuille de soins)
- [ ] Recherche patient
- [ ] Dashboard (patients du jour + résumé financier)
- [ ] Responsive PC + tablette + mobile

### Phase 2 — Enrichissement
- [ ] Statistiques et rapports avancés
- [ ] Gestion des documents / imagerie jointe
- [ ] Notifications et rappels
- [ ] Export comptable complet
- [ ] PWA installable sur mobile

### Phase 3 — Intégrations (optionnel, sur demande)
- [ ] Connexion Doctolib (import rendez-vous)
- [ ] Connexion DMP (Dossier Médical Partagé)
- [ ] Connexion laboratoires (résultats d'analyses)
- [ ] Télétransmission CPAM

---

## 7. CRITÈRES DE SUCCÈS

- Création d'une fiche patient complète en moins de 2 minutes
- File d'attente de triage visible et mise à jour en temps réel
- Historique complet d'un patient accessible en 1 clic
- Facturation d'un acte réalisable en moins de 1 minute
- Aucune perte de données en cas de coupure réseau
- Utilisable sans formation de plus de 30 minutes
- Confort d'utilisation identique sur PC, tablette et mobile

---

## VALIDATION FINALE

| Section | Statut | Décision |
|---------|--------|----------|
| Utilisateur solo | VALIDE | Confirmé |
| Hébergement cloud | VALIDE | Confirmé |
| Pas de migration | VALIDE | Confirmé |
| Intégrations tierces | VALIDE | Reportées en phase 3 |
| Sans signature électronique | VALIDE | Confirmé |
| Facturation CCAM incluse | VALIDE | Confirmé |
| Responsive PC + tablette + mobile | VALIDE | Confirmé |
| Français uniquement (v1) | VALIDE | Confirmé |

> **Statut global : APPROUVE — Le développement peut démarrer.**
