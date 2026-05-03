const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logActivity = async (userId, action, metadata = {}) => {
  try {
    await prisma.activityLog.create({ data: { userId, action, metadata } });
  } catch (err) {
    console.error('[ActivityLog Error]', err.message);
  }
};

module.exports = { logActivity };
