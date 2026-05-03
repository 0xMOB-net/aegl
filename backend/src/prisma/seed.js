require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initialisation de la base de données AEGL...\n');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@aegl87.fr';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log(`⚠️  Admin déjà existant: ${adminEmail}`);
  } else {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin2024!', 12);
    const admin = await prisma.user.create({
      data: {
        firstName: process.env.ADMIN_FIRST_NAME || 'Bureau',
        lastName: process.env.ADMIN_LAST_NAME || 'AEGL',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        gender: 'M',
        emailVerified: true,
      },
    });
    console.log(`✅ Admin créé: ${admin.email}`);
  }

  const existingArticle = await prisma.article.findFirst({ where: { slug: { contains: 'bienvenue' } } });
  if (!existingArticle) {
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    await prisma.article.create({
      data: {
        authorId: admin.id,
        title: 'Bienvenue sur le site de l\'AEGL',
        slug: 'bienvenue-sur-le-site-aegl',
        content: `L'Association des Étudiants Guinéens de Limoges (AEGL) est fière de vous accueillir sur son nouveau site web.

Notre mission est d'accompagner les étudiants guinéens dans leur installation à Limoges et leur intégration à l'Université de Limoges. Grâce à notre réseau d'hébergeurs bénévoles, nous facilitons l'obtention d'attestations d'hébergement indispensables aux démarches administratives.

N'hésitez pas à nous contacter pour toute question. Bonne route à tous !`,
        published: true,
        publishedAt: new Date(),
      },
    });
    console.log('✅ Article de bienvenue créé');
  }

  const existingAnnouncement = await prisma.announcement.findFirst();
  if (!existingAnnouncement) {
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    await prisma.announcement.create({
      data: {
        authorId: admin.id,
        title: 'Bienvenue dans l\'espace membres AEGL 🎉',
        content: 'Notre plateforme de gestion des attestations d\'hébergement est maintenant opérationnelle. Si vous avez des questions, contactez le bureau.',
        audience: 'all',
        pinned: true,
        isPublic: false,
      },
    });
    console.log('✅ Annonce de bienvenue créée');
  }

  console.log('\n🚀 Base de données initialisée avec succès !');
  console.log(`\n📧 Email admin : ${adminEmail}`);
  console.log(`🔑 Mot de passe : ${process.env.ADMIN_PASSWORD || 'Admin2024!'}`);
  console.log('\n⚠️  Changez le mot de passe admin dès la première connexion !\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
