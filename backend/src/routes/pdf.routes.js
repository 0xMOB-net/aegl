const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { generateAttestationBuffer } = require('../services/pdf.service');
const { getSignedUrl } = require('../middlewares/upload.middleware');
const prisma = require('../prisma/client');
const axios = require('axios');
router.use(authenticate);

const ALLOWED_STATUSES = ['documents_provided', 'documents_verified', 'attestation_pending', 'documents_ready', 'confirmed'];

// Extrait le public_id d'une URL Cloudinary authenticated et génère une URL signée
const resolveCloudinaryUrl = (storedUrl) => {
  if (!storedUrl) return null;
  if (storedUrl.includes('/authenticated/')) {
    const m = storedUrl.match(/cloudinary\.com\/[^/]+\/([^/]+)\/authenticated\/(?:s--[^/]+--\/)?(?:v\d+\/)?(.+)$/);
    if (!m) return null;
    const resourceType = m[1];
    let publicId = m[2];
    if (resourceType !== 'raw') publicId = publicId.replace(/\.[^.]+$/, '');
    return getSignedUrl(publicId, resourceType);
  }
  return storedUrl;
};

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
    if (!ALLOWED_STATUSES.includes(dossier.status)) {
      return res.status(400).json({ error: "L'attestation n'est pas encore disponible" });
    }

    const studentName = `${dossier.student.lastName}_${dossier.student.firstName}`;

    // Servir le PDF fusionné s'il existe (documents_ready ou confirmed)
    if (dossier.mergedPdfPath) {
      const signedUrl = resolveCloudinaryUrl(dossier.mergedPdfPath);
      if (signedUrl) {
        const response = await axios.get(signedUrl, { responseType: 'arraybuffer', timeout: 30000 });
        const buffer = Buffer.from(response.data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Dossier_complet_AEGL_${studentName}.pdf"`);
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
      }
    }

    // Fallback : générer l'attestation de base (prévisualisation admin — nécessite un hébergeur assigné)
    if (!dossier.host) {
      return res.status(400).json({ error: 'Aucun document disponible pour ce dossier' });
    }
    const buffer = await generateAttestationBuffer(dossier);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Attestation_AEGL_${studentName}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('PDF route error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message || 'Erreur lors du téléchargement' });
  }
});

module.exports = router;
