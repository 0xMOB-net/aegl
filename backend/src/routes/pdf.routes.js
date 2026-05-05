const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { generateAttestationBuffer } = require('../services/pdf.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
router.use(authenticate);

router.get('/:dossierId', async (req, res) => {
  try {
    const { user } = req;
    const dossier = await prisma.dossier.findUnique({
      where: { id: req.params.dossierId },
      include: { student: true, host: true, hostDocuments: true },
    });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });

    if (user.role === 'student' && dossier.studentId !== user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (user.role === 'host' && dossier.hostId !== user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (!['documents_provided', 'documents_verified', 'confirmed'].includes(dossier.status)) {
      return res.status(400).json({ error: "L'attestation n'est pas encore disponible" });
    }

    const buffer = await generateAttestationBuffer(dossier);
    const studentName = `${dossier.student.lastName}_${dossier.student.firstName}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Attestation_AEGL_${studentName}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors du téléchargement' });
  }
});

module.exports = router;
