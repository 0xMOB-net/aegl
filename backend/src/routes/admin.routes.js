const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { getSignedUrl } = require('../middlewares/upload.middleware');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const prisma = new PrismaClient();
router.use(authenticate, requireRole('admin'));

// Resolve a stored Cloudinary URL to a directly accessible URL.
// Public uploads (/upload/) → return as-is.
// Authenticated uploads (/authenticated/) → generate a 1h signed URL.
const resolveDocUrl = (storedUrl) => {
  if (!storedUrl) return null;
  if (storedUrl.includes('/authenticated/')) {
    const m = storedUrl.match(/cloudinary\.com\/[^/]+\/([^/]+)\/authenticated\/(?:s--[^/]+--\/)?(?:v\d+\/)?(.+)$/);
    if (!m) return storedUrl;
    const resourceType = m[1];
    let publicId = m[2];
    if (resourceType !== 'raw') publicId = publicId.replace(/\.[^.]+$/, '');
    return getSignedUrl(publicId, resourceType);
  }
  return storedUrl;
};

// Stream a document through the backend so browsers never block it as a popup.
const streamDoc = async (res, storedUrl, filename) => {
  const url = resolveDocUrl(storedUrl);
  if (!url) return res.status(404).json({ error: 'Document introuvable' });
  const upstream = await axios.get(url, { responseType: 'stream', timeout: 30000 });
  const ct = upstream.headers['content-type'] || 'application/octet-stream';
  res.setHeader('Content-Type', ct);
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  if (upstream.headers['content-length']) {
    res.setHeader('Content-Length', upstream.headers['content-length']);
  }
  upstream.data.pipe(res);
};

// Stream a student document to the admin
router.get('/dossiers/:id/view-doc', async (req, res) => {
  try {
    const { field } = req.query; // universityNotice | passport | avi
    const fieldMap = { universityNotice: 'universityNoticePath', passport: 'passportPath', avi: 'aviPath' };
    const col = fieldMap[field];
    if (!col) return res.status(400).json({ error: 'Champ invalide' });

    const dossier = await prisma.dossier.findUnique({ where: { id: req.params.id } });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });
    if (!dossier[col]) return res.status(404).json({ error: 'Document non fourni' });

    await streamDoc(res, dossier[col], `${field}_${req.params.id}`);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Erreur lors de la récupération du document' });
  }
});

// Stream a host document to the admin
router.get('/host-documents/:docId/view', async (req, res) => {
  try {
    const doc = await prisma.hostDocument.findUnique({ where: { id: req.params.docId } });
    if (!doc) return res.status(404).json({ error: 'Document introuvable' });

    await streamDoc(res, doc.filePath, `${doc.docType}_${doc.dossierId}`);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Erreur lors de la récupération du document' });
  }
});

router.get('/hosts', async (req, res) => {
  try {
    const hosts = await prisma.user.findMany({
      where: { role: 'host' },
      select: {
        id: true, firstName: true, lastName: true,
        email: true, gender: true, createdAt: true,
        lodgingSurface: true, currentOccupants: true,
        _count: { select: { hostDossiers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ hosts });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/students', async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true, firstName: true, lastName: true,
        email: true, gender: true, createdAt: true,
        _count: { select: { studentDossiers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/activity', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '50');
    const logs = await prisma.activityLog.findMany({
      include: { user: { select: { firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await prisma.activityLog.count();
    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const urgentDossiers = await prisma.dossier.findMany({
      where: {
        OR: [
          { status: 'pending', createdAt: { lt: sevenDaysAgo } },
          { status: 'documents_provided' },
          { status: 'documents_verified' },
          { status: 'attestation_pending', updatedAt: { lt: sevenDaysAgo } },
        ],
      },
      include: {
        student: { select: { firstName: true, lastName: true, email: true } },
        host: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ alerts: urgentDossiers });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.patch('/users/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
    res.json({ message: 'Mot de passe modifié' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/users/:id/impersonate', async (req, res) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const token = jwt.sign({ userId: target.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const { passwordHash, ...safeUser } = target;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous supprimer vous-même' });
    }

    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    await prisma.$transaction(async (tx) => {
      // Supprimer les logs d'activité
      await tx.activityLog.deleteMany({ where: { userId: targetId } });

      // Supprimer les réactions et commentaires sur les annonces
      await tx.announcementReaction.deleteMany({ where: { userId: targetId } });
      await tx.announcementComment.deleteMany({ where: { authorId: targetId } });

      if (user.role === 'student') {
        // Supprimer les dossiers de l'étudiant (HostDocument cascade via schema)
        await tx.dossier.deleteMany({ where: { studentId: targetId } });
      } else if (user.role === 'host') {
        // Supprimer les documents hébergeur des dossiers assignés (les dossiers eux-mêmes restent pour l'étudiant)
        const hostDossiers = await tx.dossier.findMany({ where: { hostId: targetId }, select: { id: true } });
        const dossierIds = hostDossiers.map(d => d.id);
        if (dossierIds.length > 0) {
          await tx.hostDocument.deleteMany({ where: { dossierId: { in: dossierIds } } });
        }
        // Remettre les dossiers en attente et effacer les données liées à cet hébergeur
        await tx.dossier.updateMany({
          where: { hostId: targetId },
          data: {
            hostId: null,
            status: 'pending',
            studentDocsVerified: false,
            hostAddress: null,
            attestationPath: null,
            mergedPdfPath: null,
          },
        });
      }

      // Supprimer les annonces et articles créés par l'utilisateur
      await tx.announcement.deleteMany({ where: { authorId: targetId } });
      await tx.article.deleteMany({ where: { authorId: targetId } });

      // Supprimer l'utilisateur
      await tx.user.delete({ where: { id: targetId } });
    });

    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
