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

const senderSelect = { id: true, firstName: true, lastName: true, role: true };

// Membre : lire sa conversation avec l'admin
const getMyMessages = async (req, res) => {
  try {
    const memberId = req.user.id;
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

// Membre : envoyer un message à l'admin
const sendMessage = async (req, res) => {
  try {
    const memberId = req.user.id;
    const { content } = req.body;
    if (!content?.trim() && !req.file) return res.status(400).json({ error: 'Message ou fichier requis' });

    let filePath = null;
    let fileName = null;
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

// Admin : liste des fils de discussion (une entrée par membre)
const getAdminThreads = async (req, res) => {
  try {
    const memberIds = await prisma.privateMessage.groupBy({
      by: ['memberId'],
      orderBy: { _max: { createdAt: 'desc' } },
    });

    const threads = await Promise.all(
      memberIds.map(async ({ memberId }) => {
        const [last, member, count] = await Promise.all([
          prisma.privateMessage.findFirst({
            where: { memberId },
            orderBy: { createdAt: 'desc' },
            select: { content: true, fileName: true, createdAt: true, senderId: true },
          }),
          prisma.user.findUnique({
            where: { id: memberId },
            select: { id: true, firstName: true, lastName: true, role: true, email: true },
          }),
          prisma.privateMessage.count({ where: { memberId } }),
        ]);
        return { memberId, member, lastMessage: last, messageCount: count };
      })
    );

    res.json({ threads });
  } catch (err) {
    console.error('getAdminThreads error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Admin : lire le fil d'un membre
const getAdminThread = async (req, res) => {
  try {
    const { memberId } = req.params;
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

// Admin : répondre à un membre
const adminReply = async (req, res) => {
  try {
    const { memberId } = req.params;
    const adminId = req.user.id;
    const { content } = req.body;
    if (!content?.trim() && !req.file) return res.status(400).json({ error: 'Message ou fichier requis' });

    const member = await prisma.user.findUnique({ where: { id: memberId }, select: { id: true } });
    if (!member) return res.status(404).json({ error: 'Membre introuvable' });

    let filePath = null;
    let fileName = null;
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

// Admin : diffuser un message à un groupe
const sendBroadcast = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { content, audience } = req.body;
    const validAudiences = ['all', 'students', 'hosts'];
    if (!validAudiences.includes(audience)) return res.status(400).json({ error: 'Audience invalide (all, students, hosts)' });
    if (!content?.trim() && !req.file) return res.status(400).json({ error: 'Message ou fichier requis' });

    let filePath = null;
    let fileName = null;
    if (req.file) {
      const r = await uploadToCloudinary(req.file.buffer, { folder: 'aegl/broadcasts' });
      filePath = r.secure_url;
      fileName = req.file.originalname;
    }

    const broadcast = await prisma.broadcast.create({
      data: { senderId: adminId, content: content?.trim() || null, filePath, fileName, audience },
      include: { sender: { select: senderSelect } },
    });

    res.status(201).json({ broadcast: { ...broadcast, viewUrl: buildViewUrl(broadcast.filePath) } });
  } catch (err) {
    console.error('sendBroadcast error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Admin : liste des diffusions
const getAdminBroadcasts = async (req, res) => {
  try {
    const broadcasts = await prisma.broadcast.findMany({
      include: { sender: { select: senderSelect } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ broadcasts: broadcasts.map(b => ({ ...b, viewUrl: buildViewUrl(b.filePath) })) });
  } catch (err) {
    console.error('getAdminBroadcasts error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Membre : récupérer les diffusions qui le concernent
const getMyBroadcasts = async (req, res) => {
  try {
    const { role } = req.user;
    const audienceFilter = role === 'student'
      ? { in: ['all', 'students'] }
      : role === 'host'
      ? { in: ['all', 'hosts'] }
      : { in: ['all', 'students', 'hosts'] };

    const broadcasts = await prisma.broadcast.findMany({
      where: { audience: audienceFilter },
      include: { sender: { select: senderSelect } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ broadcasts: broadcasts.map(b => ({ ...b, viewUrl: buildViewUrl(b.filePath) })) });
  } catch (err) {
    console.error('getMyBroadcasts error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getMyMessages, sendMessage, getAdminThreads, getAdminThread, adminReply, sendBroadcast, getAdminBroadcasts, getMyBroadcasts };
