const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { getSignedUrl } = require('../middlewares/upload.middleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
router.use(authenticate, requireRole('admin'));

// Resolve the correct viewable URL for a Cloudinary stored URL:
// - Old docs uploaded as public (/upload/) → return the URL as-is
// - New docs uploaded as authenticated (/authenticated/) → generate a signed URL
const resolveDocUrl = (storedUrl) => {
  if (!storedUrl) return null;
  if (storedUrl.includes('/authenticated/')) {
    // Extract resource_type and public_id then sign
    const m = storedUrl.match(/cloudinary\.com\/[^/]+\/([^/]+)\/authenticated\/(?:v\d+\/)?(.+)$/);
    if (!m) return storedUrl;
    const resourceType = m[1];
    let publicId = m[2];
    if (resourceType !== 'raw') publicId = publicId.replace(/\.[^.]+$/, '');
    return getSignedUrl(publicId, resourceType);
  }
  // Public upload — URL is directly accessible
  return storedUrl;
};

// Return the viewable URL for a student document field (admin only)
router.get('/dossiers/:id/signed-url', async (req, res) => {
  try {
    const { field } = req.query; // universityNotice | passport | avi
    const fieldMap = { universityNotice: 'universityNoticePath', passport: 'passportPath', avi: 'aviPath' };
    const col = fieldMap[field];
    if (!col) return res.status(400).json({ error: 'Champ invalide' });

    const dossier = await prisma.dossier.findUnique({ where: { id: req.params.id } });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });
    if (!dossier[col]) return res.status(404).json({ error: 'Document non fourni' });

    const url = resolveDocUrl(dossier[col]);
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Return the viewable URL for a host document (admin only)
router.get('/host-documents/:docId/signed-url', async (req, res) => {
  try {
    const doc = await prisma.hostDocument.findUnique({ where: { id: req.params.docId } });
    if (!doc) return res.status(404).json({ error: 'Document introuvable' });

    const url = resolveDocUrl(doc.filePath);
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/hosts', async (req, res) => {
  try {
    const hosts = await prisma.user.findMany({
      where: { role: 'host' },
      select: {
        id: true, firstName: true, lastName: true,
        email: true, gender: true, createdAt: true,
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

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous supprimer vous-même' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
