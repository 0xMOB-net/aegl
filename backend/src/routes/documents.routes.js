const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { upload } = require('../middlewares/upload.middleware');
const { PrismaClient } = require('@prisma/client');
const { generateAttestation } = require('../services/pdf.service');
const { logActivity } = require('../services/activity.service');

const prisma = new PrismaClient();
router.use(authenticate);

// POST /api/documents/:dossierId — hébergeur dépose ses documents
router.post('/:dossierId', requireRole('host'), upload.fields([
  { name: 'bail', maxCount: 1 },
  { name: 'energy', maxCount: 1 },
  { name: 'identity', maxCount: 1 },
]), async (req, res) => {
  try {
    const { dossierId } = req.params;
    const { address } = req.body;

    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: { student: true, host: true },
    });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });
    if (dossier.hostId !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
    if (dossier.status !== 'host_assigned') {
      return res.status(400).json({ error: 'Documents déjà soumis ou dossier non assigné' });
    }

    const files = req.files;
    if (!files.bail || !files.energy || !files.identity) {
      return res.status(400).json({ error: 'Les 3 documents sont obligatoires (bail, energy, identity)' });
    }
    if (!address) return res.status(400).json({ error: 'L\'adresse complète est obligatoire' });

    // Supprimer anciens documents si existent
    await prisma.hostDocument.deleteMany({ where: { dossierId } });

    // Créer les enregistrements documents
    const docEntries = Object.entries(files).map(([type, fileArr]) => ({
      dossierId,
      docType: type,
      filePath: `/uploads/${fileArr[0].filename}`,
    }));
    await prisma.hostDocument.createMany({ data: docEntries });

    // Mettre à jour le statut et l'adresse
    const updatedDossier = await prisma.dossier.update({
      where: { id: dossierId },
      data: { status: 'documents_provided', hostAddress: address },
      include: { student: true, host: true, hostDocuments: true },
    });

    // Générer le PDF attestation automatiquement
    const pdfPath = await generateAttestation({ ...updatedDossier, hostAddress: address });

    await logActivity(req.user.id, 'upload_documents', { dossierId, address });
    res.json({ message: 'Documents soumis avec succès', pdfPath, dossier: updatedDossier });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors du dépôt des documents' });
  }
});

// GET /api/documents/:dossierId — récupérer les documents d'un dossier
router.get('/:dossierId', async (req, res) => {
  try {
    const { dossierId } = req.params;
    const docs = await prisma.hostDocument.findMany({ where: { dossierId } });
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
