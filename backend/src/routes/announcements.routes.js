const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
router.use(authenticate);

// GET /api/announcements — liste selon rôle
router.get('/', async (req, res) => {
  try {
    const { user } = req;
    let where = {};
    if (user.role !== 'admin') {
      where.OR = [
        { audience: 'all' },
        { audience: user.role === 'student' ? 'students' : 'hosts' },
      ];
    }
    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        author: { select: { firstName: true, lastName: true } },
        _count: { select: { reactions: true, comments: true } },
      },
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
    });
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/announcements — admin crée une annonce
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { title, content, audience, pinned, isPublic } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Titre et contenu requis' });
    const announcement = await prisma.announcement.create({
      data: {
        authorId: req.user.id,
        title,
        content,
        audience: audience || 'all',
        pinned: pinned || false,
        isPublic: isPublic || false,
      },
    });
    res.status(201).json({ announcement });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/announcements/:id — admin modifie
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { title, content, audience, pinned, isPublic } = req.body;
    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: { title, content, audience, pinned, isPublic },
    });
    res.json({ announcement });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/announcements/:id — admin supprime
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ message: 'Annonce supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/announcements/:id/react — réagir 👍
router.post('/:id/react', async (req, res) => {
  try {
    const existing = await prisma.announcementReaction.findUnique({
      where: { announcementId_userId: { announcementId: req.params.id, userId: req.user.id } },
    });
    if (existing) {
      await prisma.announcementReaction.delete({ where: { id: existing.id } });
      return res.json({ reacted: false });
    }
    await prisma.announcementReaction.create({
      data: { announcementId: req.params.id, userId: req.user.id },
    });
    res.json({ reacted: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/announcements/:id/comments — commentaires
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await prisma.announcementComment.findMany({
      where: { announcementId: req.params.id },
      include: { author: { select: { firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/announcements/:id/comments — commenter
router.post('/:id/comments', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Contenu requis' });
    const comment = await prisma.announcementComment.create({
      data: { announcementId: req.params.id, authorId: req.user.id, content },
      include: { author: { select: { firstName: true, lastName: true, role: true } } },
    });
    res.status(201).json({ comment });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
