const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadToCloudinary, getSignedUrl } = require('../middlewares/upload.middleware');

const CLOUD_URL_REGEX = /cloudinary\.com\/[^/]+\/([^/]+)\/authenticated\/(?:s--[^/]+--\/)?(?:v\d+\/)?(.+)$/;

function buildViewUrl(filePath) {
  if (!filePath) return null;
  const m = filePath.match(CLOUD_URL_REGEX);
  if (!m) return filePath;
  const resourceType = m[1];
  let publicId = m[2];
  if (resourceType !== 'raw') publicId = publicId.replace(/\.[^.]+$/, '');
  return getSignedUrl(publicId, resourceType);
}

function formatBroadcast(b, currentUserId = null) {
  const reactionCounts = {};
  (b.reactions || []).forEach(r => { reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1; });
  const myReactions = currentUserId
    ? (b.reactions || []).filter(r => r.userId === currentUserId).map(r => r.emoji)
    : [];
  const { reactions: _r, ...rest } = b;
  return { ...rest, viewUrl: buildViewUrl(b.filePath), reactionCounts, myReactions };
}

const senderSelect = { id: true, firstName: true, lastName: true, role: true };
const ALLOWED_EMOJIS = ['👍', '❤️', '💪'];

// Membre : lire sa conversation (marque les messages admin comme lus)
const getMyMessages = async (req, res) => {
  try {
    const memberId = req.user.id;
    await prisma.privateMessage.updateMany({
      where: { memberId, senderId: { not: memberId }, readAt: null, deletedAt: null },
      data: { readAt: new Date() },
    });
    const messages = await prisma.privateMessage.findMany({
      where: { memberId },
      include: { sender: { select: senderSelect } },
      orderBy: { createdAt: 'asc' },
    });
    const enriched = messages.map(msg => ({ ...msg, viewUrl: buildViewUrl(msg.filePath) }));
    res.json({ messages: enriched });
  } catch (err) {
    console.error('getMyMessages error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Membre : envoyer un message
const sendMessage = async (req, res) => {
  try {
    const memberId = req.user.id;
    const { content } = req.body;
    if (!content?.trim() && !req.file) return res.status(400).json({ error: 'Message ou fichier requis' });

    let filePath = null, fileName = null;
    if (req.file) {
      const r = await uploadToCloudinary(req.file.buffer, { folder: 'aegl/messages' });
      filePath = r.secure_url;
      fileName = req.file.originalname;
    }

    const msg = await prisma.privateMessage.create({
      data: { memberId, senderId: memberId, content: content?.trim() || null, filePath, fileName },
      include: { sender: { select: senderSelect } },
    });
    res.status(201).json({ message: { ...msg, viewUrl: buildViewUrl(msg.filePath) } });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Membre : modifier son propre message
const editMyMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const memberId = req.user.id;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Contenu requis' });

    const msg = await prisma.privateMessage.findUnique({ where: { id: messageId } });
    if (!msg) return res.status(404).json({ error: 'Message introuvable' });
    if (msg.senderId !== memberId) return res.status(403).json({ error: 'Non autorisé' });
    if (msg.deletedAt) return res.status(400).json({ error: 'Message déjà supprimé' });

    const updated = await prisma.privateMessage.update({
      where: { id: messageId },
      data: { content: content.trim(), editedAt: new Date() },
      include: { sender: { select: senderSelect } },
    });
    res.json({ message: { ...updated, viewUrl: buildViewUrl(updated.filePath) } });
  } catch (err) {
    console.error('editMyMessage error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Membre : supprimer son propre message (soft delete)
const deleteMyMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const memberId = req.user.id;

    const msg = await prisma.privateMessage.findUnique({ where: { id: messageId } });
    if (!msg) return res.status(404).json({ error: 'Message introuvable' });
    if (msg.senderId !== memberId) return res.status(403).json({ error: 'Non autorisé' });

    await prisma.privateMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: null, filePath: null, fileName: null },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteMyMessage error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Membre : compter les messages non lus de l'admin
const getMemberUnreadCount = async (req, res) => {
  try {
    const memberId = req.user.id;
    const count = await prisma.privateMessage.count({
      where: { memberId, senderId: { not: memberId }, readAt: null, deletedAt: null },
    });
    res.json({ unreadCount: count });
  } catch (err) {
    console.error('getMemberUnreadCount error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Admin : liste des fils avec unreadCount
const getAdminThreads = async (req, res) => {
  try {
    const memberIds = await prisma.privateMessage.groupBy({
      by: ['memberId'],
      orderBy: { _max: { createdAt: 'desc' } },
    });

    const threads = await Promise.all(
      memberIds.map(async ({ memberId }) => {
        const [last, member, count, unreadCount] = await Promise.all([
          prisma.privateMessage.findFirst({
            where: { memberId },
            orderBy: { createdAt: 'desc' },
            select: { content: true, fileName: true, createdAt: true, senderId: true, deletedAt: true },
          }),
          prisma.user.findUnique({
            where: { id: memberId },
            select: { id: true, firstName: true, lastName: true, role: true, email: true },
          }),
          prisma.privateMessage.count({ where: { memberId } }),
          prisma.privateMessage.count({ where: { memberId, senderId: memberId, readAt: null, deletedAt: null } }),
        ]);
        return { memberId, member, lastMessage: last, messageCount: count, unreadCount };
      })
    );

    res.json({ threads });
  } catch (err) {
    console.error('getAdminThreads error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Admin : lire le fil d'un membre (marque les messages du membre comme lus)
const getAdminThread = async (req, res) => {
  try {
    const { memberId } = req.params;
    await prisma.privateMessage.updateMany({
      where: { memberId, senderId: memberId, readAt: null, deletedAt: null },
      data: { readAt: new Date() },
    });
    const [messages, member] = await Promise.all([
      prisma.privateMessage.findMany({
        where: { memberId },
        include: { sender: { select: senderSelect } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.user.findUnique({
        where: { id: memberId },
        select: { id: true, firstName: true, lastName: true, role: true, email: true },
      }),
    ]);
    if (!member) return res.status(404).json({ error: 'Membre introuvable' });
    const enriched = messages.map(msg => ({ ...msg, viewUrl: buildViewUrl(msg.filePath) }));
    res.json({ messages: enriched, member });
  } catch (err) {
    console.error('getAdminThread error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Admin : compter le total de messages non lus (tous membres)
const getAdminUnreadCount = async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM private_messages
      WHERE "senderId" = "memberId" AND "readAt" IS NULL AND "deletedAt" IS NULL
    `;
    res.json({ unreadCount: Number(result[0]?.count) || 0 });
  } catch (err) {
    console.error('getAdminUnreadCount error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Admin : modifier un de ses propres messages
const adminEditMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const adminId = req.user.id;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Contenu requis' });

    const msg = await prisma.privateMessage.findUnique({ where: { id: messageId } });
    if (!msg) return res.status(404).json({ error: 'Message introuvable' });
    if (msg.senderId !== adminId) return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres messages' });
    if (msg.deletedAt) return res.status(400).json({ error: 'Message déjà supprimé' });

    const updated = await prisma.privateMessage.update({
      where: { id: messageId },
      data: { content: content.trim(), editedAt: new Date() },
      include: { sender: { select: senderSelect } },
    });
    res.json({ message: { ...updated, viewUrl: buildViewUrl(updated.filePath) } });
  } catch (err) {
    console.error('adminEditMessage error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Admin : supprimer n'importe quel message d'un fil (soft delete)
const adminDeleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const msg = await prisma.privateMessage.findUnique({ where: { id: messageId } });
    if (!msg) return res.status(404).json({ error: 'Message introuvable' });

    await prisma.privateMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: null, filePath: null, fileName: null },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('adminDeleteMessage error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Admin : répondre à un membre
const adminReply = async (req, res) => {
  try {
    const { memberId } = req.params;
    const adminId = req.user.id;
    const { content } = req.body;
    if (!content?.trim() && !req.file) return res.status(400).json({ error: 'Message ou fichier requis' });

    const member = await prisma.user.findUnique({ where: { id: memberId }, select: { id: true } });
    if (!member) return res.status(404).json({ error: 'Membre introuvable' });

    let filePath = null, fileName = null;
    if (req.file) {
      const r = await uploadToCloudinary(req.file.buffer, { folder: 'aegl/messages' });
      filePath = r.secure_url;
      fileName = req.file.originalname;
    }

    const msg = await prisma.privateMessage.create({
      data: { memberId, senderId: adminId, content: content?.trim() || null, filePath, fileName },
      include: { sender: { select: senderSelect } },
    });
    res.status(201).json({ message: { ...msg, viewUrl: buildViewUrl(msg.filePath) } });
  } catch (err) {
    console.error('adminReply error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Admin : supprimer tout le fil d'un membre
const deleteThread = async (req, res) => {
  try {
    const { memberId } = req.params;
    await prisma.privateMessage.deleteMany({ where: { memberId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteThread error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Admin : diffuser un message
const sendBroadcast = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { content, audience } = req.body;
    const validAudiences = ['all', 'students', 'hosts'];
    if (!validAudiences.includes(audience)) return res.status(400).json({ error: 'Audience invalide' });
    if (!content?.trim() && !req.file) return res.status(400).json({ error: 'Message ou fichier requis' });

    let filePath = null, fileName = null;
    if (req.file) {
      const r = await uploadToCloudinary(req.file.buffer, { folder: 'aegl/broadcasts' });
      filePath = r.secure_url;
      fileName = req.file.originalname;
    }

    const broadcast = await prisma.broadcast.create({
      data: { senderId: adminId, content: content?.trim() || null, filePath, fileName, audience },
      include: { sender: { select: senderSelect }, reactions: { select: { userId: true, emoji: true } } },
    });
    res.status(201).json({ broadcast: formatBroadcast(broadcast, null) });
  } catch (err) {
    console.error('sendBroadcast error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Admin : supprimer une diffusion
const deleteBroadcast = async (req, res) => {
  try {
    const { broadcastId } = req.params;
    await prisma.broadcast.delete({ where: { id: broadcastId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteBroadcast error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Admin : liste des diffusions
const getAdminBroadcasts = async (req, res) => {
  try {
    const broadcasts = await prisma.broadcast.findMany({
      include: { sender: { select: senderSelect }, reactions: { select: { userId: true, emoji: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ broadcasts: broadcasts.map(b => formatBroadcast(b, null)) });
  } catch (err) {
    console.error('getAdminBroadcasts error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Membre : ses diffusions
const getMyBroadcasts = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const audienceFilter = role === 'student'
      ? { in: ['all', 'students'] }
      : role === 'host'
      ? { in: ['all', 'hosts'] }
      : { in: ['all', 'students', 'hosts'] };

    const broadcasts = await prisma.broadcast.findMany({
      where: { audience: audienceFilter },
      include: { sender: { select: senderSelect }, reactions: { select: { userId: true, emoji: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ broadcasts: broadcasts.map(b => formatBroadcast(b, userId)) });
  } catch (err) {
    console.error('getMyBroadcasts error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Membre : réagir à une diffusion
const reactToBroadcast = async (req, res) => {
  try {
    const { broadcastId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;
    if (!ALLOWED_EMOJIS.includes(emoji)) return res.status(400).json({ error: 'Emoji non autorisé' });

    const existing = await prisma.broadcastReaction.findUnique({
      where: { broadcastId_userId: { broadcastId, userId } },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        await prisma.broadcastReaction.delete({ where: { id: existing.id } });
      } else {
        await prisma.broadcastReaction.update({ where: { id: existing.id }, data: { emoji } });
      }
    } else {
      await prisma.broadcastReaction.create({ data: { broadcastId, userId, emoji } });
    }

    const raw = await prisma.broadcastReaction.groupBy({
      by: ['emoji'],
      where: { broadcastId },
      _count: { emoji: true },
    });
    const reactionCounts = Object.fromEntries(raw.map(r => [r.emoji, r._count.emoji]));
    res.json({ reactionCounts });
  } catch (err) {
    console.error('reactToBroadcast error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getMyMessages, sendMessage, editMyMessage, deleteMyMessage, getMemberUnreadCount,
  getAdminThreads, getAdminThread, adminReply, deleteThread, getAdminUnreadCount,
  adminEditMessage, adminDeleteMessage,
  sendBroadcast, deleteBroadcast, getAdminBroadcasts,
  getMyBroadcasts, reactToBroadcast,
};
