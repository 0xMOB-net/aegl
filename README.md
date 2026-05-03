# 🇬🇳 AEGL — Site Web Officiel
**Association des Étudiants Guinéens de Limoges**

Plateforme complète de gestion des attestations d'hébergement pour l'AEGL, avec site public vitrine et espace membres sécurisé.

---

## 🏗️ Architecture

```
aegl/
├── backend/          → API Node.js + Express + Prisma + PostgreSQL
└── frontend/         → React + Vite + TailwindCSS
```

**Stack technique :**
- **Backend** : Node.js, Express, Prisma ORM, PostgreSQL, PDFKit, Nodemailer, JWT
- **Frontend** : React 18, Vite, TailwindCSS, React Router v6, Axios

---

## ⚡ Démarrage rapide

### Prérequis
- Node.js 18+ installé
- PostgreSQL installé et démarré
- npm installé

---

### 1. Configurer le Backend

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env
```

**Éditer le fichier `.env` :**
```env
DATABASE_URL=postgresql://VOTRE_USER:VOTRE_MDP@localhost:5432/aegl_db
JWT_SECRET=remplacez_par_32_caracteres_aleatoires_minimum
ADMIN_EMAIL=admin@aegl87.fr
ADMIN_PASSWORD=VotreMotDePasseAdmin!
FRONTEND_URL=http://localhost:5173
```

```bash
# Créer la base de données PostgreSQL (depuis psql ou pgAdmin)
# CREATE DATABASE aegl_db;

# Générer le client Prisma
npx prisma generate

# Pousser le schéma vers la base
npx prisma db push

# Créer le compte admin initial
node src/prisma/seed.js

# Démarrer le backend en mode développement
npm run dev
# → Serveur démarré sur http://localhost:4000
```

---

### 2. Configurer le Frontend

```bash
# Nouveau terminal — aller dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Démarrer le frontend
npm run dev
# → Site accessible sur http://localhost:5173
```

---

## 📋 Comptes par défaut (après seed)

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| **Admin** | admin@aegl87.fr | (celui défini dans .env) |

Pour créer des comptes hébergeur et étudiant, utilisez le formulaire d'inscription `/inscription`.

---

## 🗂️ Workflow des dossiers (4 étapes)

```
[ÉTUDIANT crée dossier]
        ↓
  ①  pending
        ↓ Admin assigne un hébergeur
  ②  host_assigned
        ↓ Hébergeur soumet ses 3 documents + adresse
  ③  documents_provided  →  PDF généré automatiquement
        ↓ Admin valide (ou rejette → retour ②)
  ④  documents_verified
        ↓ Admin clôture → email envoyé à l'étudiant
  ✅  confirmed
```

**Documents requis de l'hébergeur :**
1. 📋 Contrat de bail
2. ⚡ Contrat d'énergie (électricité ou gaz)
3. 🪪 Pièce d'identité

---

## 📄 Génération PDF automatique

- **20 variantes** de texte d'attestation disponibles
- **Sélection déterministe** : même dossier = même variante (basé sur hash de l'ID)
- **Accords grammaticaux** automatiques selon le genre de l'hébergeur ET de l'étudiant
- **Générée** automatiquement à la soumission des documents ET à la clôture

---

## 🔐 Rôles et permissions

| Action | Admin | Hébergeur | Étudiant |
|--------|-------|-----------|----------|
| Créer un dossier | ✅ | ❌ | ✅ |
| Assigner un hébergeur | ✅ | ❌ | ❌ |
| Soumettre les documents | ❌ | ✅ | ❌ |
| Valider/Rejeter les docs | ✅ | ❌ | ❌ |
| Clôturer le dossier | ✅ | ❌ | ❌ |
| Télécharger l'attestation | ✅ | ✅ | ✅ |
| Gérer les annonces | ✅ | ❌ | ❌ |
| Gérer les articles | ✅ | ❌ | ❌ |

---

## 📡 API Endpoints

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/reset-password` | Réinitialiser mot de passe |
| GET | `/api/auth/me` | Profil connecté |

### Dossiers
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/dossiers` | Liste (filtrée par rôle) |
| GET | `/api/dossiers/stats` | Statistiques (admin) |
| GET | `/api/dossiers/:id` | Détail d'un dossier |
| POST | `/api/dossiers` | Créer un dossier |
| PATCH | `/api/dossiers/:id/assign-host` | Assigner hébergeur (admin) |
| PATCH | `/api/dossiers/:id/revoke-host` | Révoquer hébergeur (admin) |
| PATCH | `/api/dossiers/:id/validate-docs` | Valider docs (admin) |
| PATCH | `/api/dossiers/:id/reject-docs` | Rejeter docs (admin) |
| PATCH | `/api/dossiers/:id/close` | Clôturer dossier (admin) |
| PATCH | `/api/dossiers/:id/notes` | Mettre à jour notes (admin) |

### Documents (hébergeur)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/documents/:dossierId` | Soumettre les 3 documents |
| GET | `/api/documents/:dossierId` | Voir les documents |

### PDF
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/pdf/:dossierId` | Télécharger le PDF |

### Annonces
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/announcements` | Liste des annonces |
| POST | `/api/announcements` | Créer (admin) |
| PUT | `/api/announcements/:id` | Modifier (admin) |
| DELETE | `/api/announcements/:id` | Supprimer (admin) |
| POST | `/api/announcements/:id/react` | Réagir 👍 |
| GET | `/api/announcements/:id/comments` | Commentaires |
| POST | `/api/announcements/:id/comments` | Commenter |

### Articles
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/articles` | Articles publiés (public) |
| GET | `/api/articles/:slug` | Un article (public) |
| GET | `/api/articles/admin/all` | Tous les articles (admin) |
| POST | `/api/articles` | Créer (admin) |
| PUT | `/api/articles/:id` | Modifier (admin) |
| DELETE | `/api/articles/:id` | Supprimer (admin) |

### Admin
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/admin/hosts` | Liste des hébergeurs |
| GET | `/api/admin/students` | Liste des étudiants |
| GET | `/api/admin/activity` | Journal d'activité |
| GET | `/api/admin/alerts` | Dossiers urgents |

---

## 🚀 Déploiement en production

### Option A — Railway (Backend) + Vercel (Frontend) — Recommandée

**Backend sur Railway :**
1. Créer un compte sur [railway.app](https://railway.app)
2. Nouveau projet → "Deploy from GitHub repo"
3. Choisir le dossier `backend/`
4. Ajouter un service PostgreSQL dans le même projet
5. Copier la `DATABASE_URL` fournie par Railway
6. Configurer toutes les variables d'environnement dans l'onglet Variables
7. Le backend sera accessible sur une URL `*.railway.app`

**Frontend sur Vercel :**
1. Créer un compte sur [vercel.com](https://vercel.com)
2. "Import Project" → GitHub
3. Root directory : `frontend/`
4. Ajouter la variable d'environnement :
   ```
   VITE_API_URL=https://votre-backend.railway.app
   ```
5. Dans `vite.config.js`, mettre à jour la cible du proxy avec l'URL Railway
6. Le frontend sera sur `*.vercel.app`

**Connecter votre domaine IONOS :**
1. Aller dans Vercel → Settings → Domains → Ajouter votre domaine IONOS
2. Vercel vous donne des records DNS à configurer
3. Sur IONOS → Domaines → DNS → Ajouter les records fournis par Vercel
4. Attendre la propagation (5 à 30 minutes)

---

### Option B — VPS IONOS

```bash
# Sur votre VPS (Ubuntu 22.04)

# Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Cloner votre projet
git clone https://github.com/VOTRE_REPO/aegl.git
cd aegl

# Backend
cd backend && npm install
cp .env.example .env
# Éditer .env avec les vraies valeurs
npx prisma generate && npx prisma db push
node src/prisma/seed.js

# Installer PM2 pour garder le backend vivant
sudo npm install -g pm2
pm2 start src/server.js --name "aegl-backend"
pm2 save && pm2 startup

# Frontend — build de production
cd ../frontend && npm install
npm run build
# Servir le dossier dist/ avec Nginx

# Installer Nginx
sudo apt-get install -y nginx
```

**Configuration Nginx (exemple) :**
```nginx
server {
    listen 80;
    server_name aegl87.fr www.aegl87.fr;

    # Frontend React (fichiers statiques)
    location / {
        root /var/www/aegl/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Fichiers uploadés
    location /uploads/ {
        alias /var/www/aegl/backend/uploads/;
    }

    location /pdfs/ {
        alias /var/www/aegl/backend/pdfs/;
    }
}
```

```bash
# Activer HTTPS avec Let's Encrypt (GRATUIT)
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d aegl87.fr -d www.aegl87.fr
```

---

## 🧪 Variables d'environnement — Référence complète

```env
# Application
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://aegl87.fr

# Base de données
DATABASE_URL=postgresql://user:password@host:5432/aegl_db

# Authentification JWT
JWT_SECRET=chaine_aleatoire_minimum_32_caracteres
JWT_EXPIRES_IN=7d

# Stockage fichiers
UPLOAD_DIR=./uploads
PDF_OUTPUT_DIR=./pdfs
MAX_FILE_SIZE_MB=10

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=contact@aegl87.fr
SMTP_PASS=mot_de_passe_application_gmail
EMAIL_FROM=contact@aegl87.fr
EMAIL_FROM_NAME=AEGL - Association des Étudiants Guinéens de Limoges

# Compte admin initial (seed uniquement)
ADMIN_EMAIL=admin@aegl87.fr
ADMIN_PASSWORD=MotDePasseForte2024!
ADMIN_FIRST_NAME=Bureau
ADMIN_LAST_NAME=AEGL
```

**Pour Gmail SMTP :**
1. Activer la validation en 2 étapes sur le compte Gmail
2. Aller dans Sécurité → Mots de passe des applications
3. Générer un mot de passe pour "Messagerie"
4. Utiliser ce mot de passe dans `SMTP_PASS`

---

## 📁 Structure des fichiers

```
backend/src/
├── app.js                    # Express app principale
├── server.js                 # Point d'entrée
├── prisma/
│   ├── schema.prisma         # Schéma BDD complet
│   └── seed.js               # Données initiales
├── routes/
│   ├── auth.routes.js
│   ├── dossiers.routes.js
│   ├── documents.routes.js
│   ├── announcements.routes.js
│   ├── articles.routes.js
│   ├── pdf.routes.js
│   └── admin.routes.js
├── controllers/
│   ├── auth.controller.js
│   └── dossiers.controller.js
├── services/
│   ├── pdf.service.js        # Génération PDF (PDFKit)
│   ├── email.service.js      # Emails (Nodemailer)
│   └── activity.service.js   # Journal activité
├── middlewares/
│   ├── auth.middleware.js    # Vérification JWT
│   ├── role.middleware.js    # Contrôle des rôles
│   └── upload.middleware.js  # Multer (upload fichiers)
└── utils/
    └── attestation.variants.js  # 20 variantes texte PDF

frontend/src/
├── App.jsx                   # Router principal
├── main.jsx                  # Point d'entrée React
├── index.css                 # Styles globaux + classes utilitaires
├── api/client.js             # Instance Axios + intercepteurs JWT
├── context/AuthContext.jsx   # État authentification global
├── components/
│   ├── public/
│   │   ├── Navbar.jsx        # Navigation publique responsive
│   │   └── Footer.jsx        # Pied de page
│   └── members/
│       ├── MemberLayout.jsx  # Layout sidebar espace membres
│       └── SharedComponents.jsx  # StatusBadge, DossierStepper, StatCard
└── pages/
    ├── public/               # Home, About, Services, News, Contact
    ├── auth/                 # Login, Register, ResetPassword
    ├── admin/                # Dashboard, Dossiers, DossierDetail, etc.
    ├── host/                 # MyDossiers, Attestations, Alerts
    ├── student/              # MyDossier, Alerts
    └── members/              # Announcements (partagé)
```

---

## 🎨 Design

- **Couleurs** : Vert #1a5c3a, Or #FCD116, Rouge #CE1126 (drapeau guinéen)
- **Polices** : Playfair Display (titres) + DM Sans (corps)
- **Animations** : fade-in, slide-up sur les transitions de pages

---

## 🆘 Support

Pour toute question technique, contactez l'équipe de développement ou ouvrez une issue sur le dépôt GitHub du projet.

**AEGL** — *Solidarité, Entraide, Réussite* 🇬🇳
