const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Publique — liste des collectes actives
router.get('/', async (req, res) => {
  try {
    const collectes = await prisma.collecte.findMany({
      where: { isActive: true },
      select: { id: true, title: true, description: true, goal: true, helloassoUrl: true },
      orderBy: { createdAt: 'desc' },
    });
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ collectes });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin — toutes les collectes
router.get('/all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const collectes = await prisma.collecte.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ collectes });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin — créer une collecte
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { title, description, goal, helloassoUrl } = req.body;
    if (!title || !description || !helloassoUrl) {
      return res.status(400).json({ error: 'Titre, description et lien HelloAsso sont obligatoires' });
    }
    const collecte = await prisma.collecte.create({
      data: {
        title,
        description,
        goal: goal ? parseInt(goal) : null,
        helloassoUrl,
        authorId: req.user.id,
      },
    });
    res.status(201).json({ collecte });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin — modifier une collecte
router.patch('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { title, description, goal, helloassoUrl, isActive } = req.body;
    const data = {};
    if (title !== undefined)        data.title = title;
    if (description !== undefined)  data.description = description;
    if (goal !== undefined)         data.goal = goal ? parseInt(goal) : null;
    if (helloassoUrl !== undefined) data.helloassoUrl = helloassoUrl;
    if (isActive !== undefined)     data.isActive = isActive;

    const collecte = await prisma.collecte.update({ where: { id: req.params.id }, data });
    res.json({ collecte });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin — supprimer une collecte
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await prisma.collecte.delete({ where: { id: req.params.id } });
    res.json({ message: 'Collecte supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
