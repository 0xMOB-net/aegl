const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { upload, uploadToCloudinary } = require('../middlewares/upload.middleware');
const prisma = require('../prisma/client');
const { logActivity } = require('../services/activity.service');
router.use(authenticate);

// Types attendus : bail (1), identity (1), quittance_1/2/3 (3), facture_1/2/3 (3) = 8 fichiers
const HOST_DOC_FIELDS = [
  { name: 'bail',        maxCount: 1 },
  { name: 'identity',   maxCount: 1 },
  { name: 'quittance_1', maxCount: 1 },
  { name: 'quittance_2', maxCount: 1 },
  { name: 'quittance_3', maxCount: 1 },
  { name: 'facture_1',  maxCount: 1 },
  { name: 'facture_2',  maxCount: 1 },
  { name: 'facture_3',  maxCount: 1 },
];

const REQUIRED_FIELDS = ['bail', 'identity', 'quittance_1', 'quittance_2', 'quittance_3', 'facture_1', 'facture_2', 'facture_3'];

router.post('/:dossierId', requireRole('host'), upload.fields(HOST_DOC_FIELDS), async (req, res) => {
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

    const files = req.files || {};
    const missing = REQUIRED_FIELDS.filter(f => !files[f]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Documents manquants : ${missing.join(', ')}` });
    }
    if (!address) return res.status(400).json({ error: 'L\'adresse complète est obligatoire' });

    await prisma.hostDocument.deleteMany({ where: { dossierId } });

    const docEntries = await Promise.all(
      Object.entries(files).map(async ([type, fileArr]) => {
        const file = fileArr[0];
        const result = await uploadToCloudinary(file.buffer, {
          folder: 'aegl/documents',
          public_id: `${dossierId}_${type}_${Date.now()}`,
        });
        return { dossierId, docType: type, filePath: result.secure_url };
      })
    );
    await prisma.hostDocument.createMany({ data: docEntries });

    const updatedDossier = await prisma.dossier.update({
      where: { id: dossierId },
      data: { status: 'documents_provided', hostAddress: address },
      include: { student: true, host: true, hostDocuments: true },
    });

    await logActivity(req.user.id, 'upload_documents', { dossierId, address });
    res.json({ message: 'Documents soumis avec succès', dossier: updatedDossier });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors du dépôt des documents' });
  }
});

router.get('/:dossierId', async (req, res) => {
  try {
    const { dossierId } = req.params;
    const dossier = await prisma.dossier.findUnique({ where: { id: dossierId } });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });
    const isAdmin = req.user.role === 'admin';
    const isStudent = dossier.studentId === req.user.id;
    const isHost = dossier.hostId === req.user.id;
    if (!isAdmin && !isStudent && !isHost) return res.status(403).json({ error: 'Accès refusé' });
    const docs = await prisma.hostDocument.findMany({ where: { dossierId } });
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
