const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { sendContactEmail } = require('../services/email.service');

// 5 messages max par IP par heure
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de messages envoyés. Réessayez dans une heure.' },
});

router.post('/', contactLimiter, async (req, res) => {
  const { name, email, topic, message } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Nom, email et message sont obligatoires.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }
  if (message.length > 3000) {
    return res.status(400).json({ error: 'Message trop long (3000 caractères max).' });
  }

  // Répondre immédiatement — l'email part en arrière-plan
  res.json({ message: 'Message envoyé avec succès.' });
  sendContactEmail({ name: name.trim(), email: email.trim(), topic: topic?.trim() || '', message: message.trim() })
    .catch(err => console.error('sendContactEmail failed:', err.message));
});

module.exports = router;
