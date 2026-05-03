# Guide de déploiement AEGL

## Architecture
- **Frontend** → Vercel (gratuit) — aegl87.fr
- **Backend** → Render (gratuit) — aegl-api.onrender.com
- **Base de données** → Neon (déjà configuré)
- **Domaine** → IONOS → pointer vers Vercel

---

## ÉTAPE 1 — GitHub (dépôt de code)

Le code est déjà commité. Il faut créer un repo GitHub et pousser.

```bash
git remote add origin https://github.com/VOTRE_USERNAME/aegl.git
git branch -M main
git push -u origin main
```

---

## ÉTAPE 2 — Déployer le Backend sur Render

1. Aller sur https://render.com → Sign Up (gratuit)
2. **New Web Service** → connecter GitHub → sélectionner le repo `aegl`
3. Configurer :
   - **Name** : `aegl-api`
   - **Root Directory** : `backend`
   - **Runtime** : Node
   - **Build Command** : `npm install && npx prisma generate --schema=src/prisma/schema.prisma`
   - **Start Command** : `node src/server.js`
   - **Plan** : Free
4. Ajouter les **Environment Variables** :
   ```
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=postgresql://neondb_owner:npg_Te0oJbtyE3mi@ep-muddy-bar-al9o18za.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET=aegl87_jwt_secret_limoges_guinee_2024_secure_key_32chars
   FRONTEND_URL=https://aegl87.fr
   ADMIN_EMAIL=admin@aegl87.fr
   ADMIN_PASSWORD=Admin@AEGL2024!
   ```
5. Cliquer **Create Web Service**
6. Attendre le déploiement (~5 min) → noter l'URL : `https://aegl-api.onrender.com`

---

## ÉTAPE 3 — Déployer le Frontend sur Vercel

1. Aller sur https://vercel.com → Sign Up (gratuit)
2. **New Project** → connecter GitHub → sélectionner le repo `aegl`
3. Configurer :
   - **Root Directory** : `frontend`
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
4. Ajouter les **Environment Variables** :
   ```
   VITE_API_URL=https://aegl-api.onrender.com/api
   ```
5. Cliquer **Deploy**
6. URL temporaire : `https://aegl-xxxx.vercel.app`

---

## ÉTAPE 4 — Configurer le domaine aegl87.fr (IONOS → Vercel)

### Sur Vercel :
1. Settings → Domains → Add `aegl87.fr` et `www.aegl87.fr`
2. Vercel vous donne des enregistrements DNS à ajouter

### Sur IONOS :
1. Se connecter à https://www.ionos.fr
2. Domaines → aegl87.fr → DNS
3. Supprimer les enregistrements A existants
4. Ajouter :
   ```
   Type A    @    76.76.21.21          TTL: 300
   Type A    www  76.76.21.21          TTL: 300
   CNAME     www  cname.vercel-dns.com TTL: 300
   ```
5. Attendre la propagation DNS (15 min à 2h)

---

## ÉTAPE 5 — Vérifications finales

Après déploiement, tester :
- [ ] https://aegl87.fr charge le site
- [ ] https://aegl87.fr/login fonctionne
- [ ] Connexion admin : admin@aegl87.fr / Admin@AEGL2024!
- [ ] Création d'un compte étudiant
- [ ] Téléchargement PDF attestation

---

## Variables d'environnement Render (à copier-coller)

```
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://neondb_owner:npg_Te0oJbtyE3mi@ep-muddy-bar-al9o18za.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=aegl87_jwt_secret_limoges_guinee_2024_secure_key_32chars
FRONTEND_URL=https://aegl87.fr
ADMIN_EMAIL=admin@aegl87.fr
ADMIN_PASSWORD=Admin@AEGL2024!
```

## Variable d'environnement Vercel (à copier-coller)

```
VITE_API_URL=https://aegl-api.onrender.com/api
```
