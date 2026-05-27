const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');

const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const articles = await prisma.article.findMany({
      where: { published: true },
      select: { id: true, title: true, slug: true, coverImage: true, publishedAt: true, content: true, author: { select: { firstName: true, lastName: true } } },
      orderBy: { publishedAt: 'desc' },
    });
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const article = await prisma.article.findUnique({
      where: { slug: req.params.slug },
      select: { id: true, title: true, slug: true, content: true, coverImage: true, publishedAt: true, author: { select: { firstName: true, lastName: true } } },
    });
    if (!article || !article.published) return res.status(404).json({ error: 'Article introuvable' });
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ article });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { title, content, coverImage, published } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Titre et contenu requis' });
    const slug = slugify(title, { lower: true, strict: true, locale: 'fr' });
    const article = await prisma.article.create({
      data: {
        authorId: req.user.id,
        title,
        slug: `${slug}-${Date.now()}`,
        content,
        coverImage,
        published: published || false,
        publishedAt: published ? new Date() : null,
      },
    });
    res.status(201).json({ article });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { title, content, coverImage, published } = req.body;
    const existing = await prisma.article.findUnique({ where: { id: req.params.id } });
    const wasPublished = existing?.published;
    const article = await prisma.article.update({
      where: { id: req.params.id },
      data: {
        title,
        content,
        coverImage,
        published,
        publishedAt: published && !wasPublished ? new Date() : undefined,
      },
    });
    res.json({ article });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await prisma.article.delete({ where: { id: req.params.id } });
    res.json({ message: 'Article supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/admin/all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const articles = await prisma.article.findMany({
      include: { author: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
