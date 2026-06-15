const { PrismaClient } = require('@prisma/client');

const prisma = global._prisma ?? new PrismaClient({
  log: ['error'],
  datasources: { db: { url: process.env.DATABASE_URL } },
});

global._prisma = prisma;

module.exports = prisma;
