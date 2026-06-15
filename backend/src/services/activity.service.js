const prisma = require('../prisma/client');

const logActivity = async (userId, action, metadata = {}) => {
  try {
    await prisma.activityLog.create({ data: { userId, action, metadata } });
  } catch (err) {
    console.error('[ActivityLog Error]', err.message);
  }
};

module.exports = { logActivity };
