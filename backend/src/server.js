require('dotenv').config();
const app = require('./app');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const dirs = [
  process.env.UPLOAD_DIR || './uploads',
  process.env.PDF_OUTPUT_DIR || './pdfs',
];
dirs.forEach(dir => {
  const fullPath = path.resolve(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// Keep Neon DB compute alive — Neon suspend le compute après 5 min d'inactivité sur free tier
const prismaKeepalive = new PrismaClient();
setInterval(async () => {
  try { await prismaKeepalive.$executeRaw`SELECT 1`; } catch {}
}, 4 * 60 * 1000); // toutes les 4 min

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 Serveur AEGL démarré sur http://localhost:${PORT}`);
  console.log(`📦 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend autorisé: ${process.env.FRONTEND_URL}\n`);

  // Auto-ping toutes les 14 min pour empêcher Render de mettre le serveur en veille
  if (process.env.RENDER_EXTERNAL_URL) {
    const url = `${process.env.RENDER_EXTERNAL_URL}/api/health`;
    setInterval(() => {
      require('https').get(url, () => {}).on('error', () => {});
    }, 14 * 60 * 1000);
    console.log(`♻️  Keep-alive actif → ${url}`);
  }
  console.log(`♻️  Neon DB keep-alive actif (ping toutes les 4 min)\n`);
});
