// Script de réinitialisation du mot de passe admin
// Usage : node src/prisma/reset-admin-password.js <nouveau-mot-de-passe>
// Exemple : node src/prisma/reset-admin-password.js MonNouveauMotDePasse123!

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const newPassword = process.argv[2];
  if (!newPassword) {
    console.error('❌ Usage : node src/prisma/reset-admin-password.js <nouveau-mot-de-passe>');
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@aegl87.fr';
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });

  if (!admin) {
    console.error('❌ Aucun compte admin trouvé en base de données.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: admin.id }, data: { passwordHash } });

  console.log(`✅ Mot de passe réinitialisé pour : ${admin.email}`);
  console.log(`🔑 Nouveau mot de passe : ${newPassword}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
