const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
router.use(authenticate, requireRole('admin'));

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
