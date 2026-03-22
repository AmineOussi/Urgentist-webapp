# USS-I.COM — Guide de démarrage

## Prérequis
- Node.js 18+
- npm / pnpm
- Compte Supabase (projet créé)

---

## 1. Installer les dépendances

```bash
npm install
```

---

## 2. Configurer l'environnement

Le fichier `.env` est déjà pré-rempli avec les credentials Supabase.

Ajouter les clés API manquantes depuis **Supabase Dashboard > Settings > API** :

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 3. Appliquer le schéma en base

### Option A — Via Supabase SQL Editor (recommandé)
1. Ouvrir **Supabase Dashboard > SQL Editor**
2. Copier-coller le contenu de `prisma/migrations/001_init/migration.sql`
3. Cliquer **Run**

### Option B — Via CLI Prisma (depuis votre machine)
```bash
# Générer le client Prisma
npx prisma generate

# Pousser le schéma en base (sans migration)
npx prisma db push

# OU créer une migration formelle
npx prisma migrate dev --name init
```

---

## 4. Importer les médicaments CNOPS

```bash
# Placer le fichier CNOPS dans le dossier parent du projet
# ref-des-medicaments-cnops-2014.xlsx

npm run db:seed-meds
# → Import 5 917 médicaments en ~30 secondes
```

---

## 5. Seed données de développement

```bash
npm run db:seed
# → Crée 2 patients, 1 visite active, constantes, bilans
```

---

## 6. Lancer l'application

```bash
npm run dev
# → http://localhost:3000
```

---

## 7. Prisma Studio (interface visuelle DB)

```bash
npm run db:studio
# → http://localhost:5555
```

---

## Structure des fichiers

```
uss-i-app/
├── prisma/
│   ├── schema.prisma              ← Modèles de données (12 modèles)
│   └── migrations/001_init/
│       └── migration.sql          ← SQL à appliquer sur Supabase
├── src/
│   ├── middleware.ts              ← Auth guard Supabase sur toutes les routes
│   ├── types/index.ts             ← Types TypeScript partagés
│   ├── lib/
│   │   ├── prisma.ts              ← Client Prisma singleton
│   │   └── supabase.ts            ← Clients Supabase (server/browser/admin)
│   ├── app/
│   │   ├── layout.tsx             ← Root layout (Inter font, globals.css)
│   │   ├── page.tsx               ← Redirect → /dashboard
│   │   ├── globals.css            ← Tailwind + animations CSS
│   │   ├── (auth)/login/          ← Page de connexion
│   │   ├── (app)/                 ← Layout authentifié + sidebar
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/         ← Salle d'attente (ISR 30s)
│   │   │   └── patients/[id]/     ← Fiche patient complète
│   │   └── api/
│   │       ├── auth/callback/     ← OAuth / magic link callback
│   │       ├── visites/           ← GET liste, POST créer
│   │       │   └── [id]/
│   │       │       ├── route.ts   ← GET détail, PATCH statut
│   │       │       └── consultation/ ← PUT note SOAP
│   │       ├── patients/[id]/     ← GET dossier complet
│   │       ├── constantes/        ← POST relevé constantes
│   │       ├── bilans/            ← POST prescrire
│   │       │   └── [id]/          ← PATCH saisir résultat
│   │       ├── prescriptions/     ← POST créer ordonnance
│   │       └── medicaments/       ← GET recherche (contains)
│   └── components/
│       ├── ui/
│       │   ├── AppSidebar.tsx     ← Sidebar navigation + logout
│       │   └── NouvelleVisiteButton.tsx ← Modal triage rapide
│       └── patient/
│           └── PatientView.tsx    ← Fiche patient (tabs + chart + SOAP)
├── scripts/
│   ├── seed.ts                    ← Données de dev
│   └── import-medicaments.ts      ← Import CNOPS 5917 médicaments
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── .env                           ← Variables (ne pas committer)
└── package.json
```

---

## Tables créées

| Table                 | Description                          |
|-----------------------|--------------------------------------|
| `users`               | Médecins, infirmiers, accueil        |
| `patients`            | Dossiers patients                    |
| `visites`             | Passages aux urgences                |
| `constantes_vitales`  | Relevés multi-temporels (TA, FC...) |
| `consultations`       | Notes SOAP du médecin                |
| `medicaments`         | Référentiel CNOPS 5917 molécules     |
| `prescriptions`       | Ordonnances                          |
| `prescription_items`  | Lignes d'ordonnance                  |
| `bilans`              | Examens biologiques et imagerie      |
| `antecedents`         | Antécédents médicaux                 |
| `allergies`           | Allergies connues (alerte rapide)    |
| `encaissements`       | Facturation                          |
| `boxes`               | Boxes/salles de consultation         |

**Vue utile** : `v_salle_attente` — patients actifs triés par priorité + dernières constantes.
