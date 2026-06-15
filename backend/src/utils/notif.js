const prisma = require('../prisma/client');
const { sendPush } = require('./pushNotif');

const createNotif = async (userId, type, title, body = null, link = null) => {
  try {
    await prisma.notification.create({ data: { userId, type, title, body, link } });
    sendPush(userId, { title, body, type, url: link }).catch(() => {});
  } catch (err) {
    console.error('[NOTIF]', err.message);
  }
};

const notifyAdmins = async (type, title, body = null, link = null) => {
  try {
    const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } });
    await Promise.all(admins.map(a => createNotif(a.id, type, title, body, link)));
  } catch (err) {
    console.error('[NOTIF ADMINS]', err.message);
  }
};

module.exports = { createNotif, notifyAdmins };
