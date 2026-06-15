const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const prisma = require('../prisma/client');

router.use(authenticate);

router.post('/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth)
      return res.status(400).json({ error: 'Données d\'abonnement invalides' });
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId: req.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { userId: req.user.id, p256dh: keys.p256dh, auth: keys.auth },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.user.id } });
    } else {
      await prisma.pushSubscription.deleteMany({ where: { userId: req.user.id } });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
