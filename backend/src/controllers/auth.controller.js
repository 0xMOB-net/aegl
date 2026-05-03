const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../services/activity.service');

const prisma = new PrismaClient();

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, gender, role } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !gender || !role) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
    }
    if (!['M', 'F'].includes(gender)) {
      return res.status(400).json({ error: 'Genre invalide (M ou F)' });
    }
    if (!['host', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Mot de passe trop court (8 caractères minimum)' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { firstName, lastName, email, passwordHash, gender, role, emailVerified: true },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, gender: true },
    });

    await logActivity(user.id, 'register', { email });
    const token = generateToken(user.id);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    await logActivity(user.id, 'login', { email });
    const token = generateToken(user.id);
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { firstName, lastName, email, newPassword } = req.body;
    if (!firstName || !lastName || !email || !newPassword) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Mot de passe trop court (8 caractères minimum)' });
    }

    const user = await prisma.user.findFirst({
      where: {
        email,
        firstName: { equals: firstName, mode: 'insensitive' },
        lastName: { equals: lastName, mode: 'insensitive' },
      },
    });
    if (!user) return res.status(404).json({ error: 'Aucun compte trouvé avec ces informations' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await logActivity(user.id, 'reset_password', {});
    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  const { passwordHash, ...safeUser } = req.user;
  res.json({ user: safeUser });
};

module.exports = { register, login, resetPassword, me };
