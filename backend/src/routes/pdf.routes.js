const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();
router.use(authenticate);

router.get('/:dossierId', async (req, res) => {
  try {
    const { user } = req;
    const dossier = await prisma.dossier.findUnique({
      where: { id: req.params.dossierId },
      include: { student: true, host: true },
    });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });

    if (user.role === 'student' && dossier.studentId !== user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (user.role === 'host' && dossier.hostId !== user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (!['documents_provided', 'documents_verified', 'confirmed'].includes(dossier.status)) {
      return res.status(400).json({ error: 'L\'attestation n\'est pas encore disponible' });
    }

    const filename = `attestation_${dossier.id}.pdf`;
    const pdfDir = path.resolve(process.env.PDF_OUTPUT_DIR || './pdfs');
    const filePath = path.join(pdfDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF non trouvé. Veuillez contacter l\'administrateur.' });
    }

    const studentName = `${dossier.student.lastName}_${dossier.student.firstName}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Attestation_AEGL_${studentName}.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors du téléchargement' });
  }
});

module.exports = router;
