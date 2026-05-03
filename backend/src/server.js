require('dotenv').config();
const app = require('./app');
const fs = require('fs');
const path = require('path');

const dirs = [
  process.env.UPLOAD_DIR || './uploads',
  process.env.PDF_OUTPUT_DIR || './pdfs',
];
dirs.forEach(dir => {
  const fullPath = path.resolve(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 Serveur AEGL démarré sur http://localhost:${PORT}`);
  console.log(`📦 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend autorisé: ${process.env.FRONTEND_URL}\n`);
});
