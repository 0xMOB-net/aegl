const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../services/activity.service');
const { sendAttestationToHostEmail, sendMergedDossierEmail, sendHostAssignedEmail } = require('../services/email.service');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Extrait le public_id d'une URL Cloudinary et supprime le fichier (fire-and-forget)
const deleteCloudinaryFile = (url) => {
  if (!url) return;
  const m = url.match(/cloudinary\.com\/[^/]+\/([^/]+)\/(?:authenticated|upload)\/(?:s--[^/]+--\/)?(?:v\d+\/)?(.+)$/);
  if (!m) return;
  const resourceType = m[1];
  let publicId = m[2];
  if (resourceType !== 'raw') publicId = publicId.replace(/\.[^.]+$/, '');
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: 'authenticated' })
    .catch(err => console.error(`Cloudinary delete failed for ${publicId}:`, err.message));
};
const { generateAttestationBuffer } = require('../services/pdf.service');
const { mergeDocuments, mergeFromBuffers, uploadBuffer } = require('../services/merge.service');
const { uploadToCloudinary, getSignedUrl } = require('../middlewares/upload.middleware');

const prisma = new PrismaClient();

// Full select — admin only (includes raw file URLs)
const dossierSelect = {
  id: true,
  status: true,
  universityNoticePath: true,
  passportPath: true,
  aviPath: true,
  studentDocsVerified: true,
  studentDocsRejectedReason: true,
  adminNotes: true,
  pdfVariant: true,
  hostAddress: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  student: { select: { id: true, firstName: true, lastName: true, email: true, gender: true, dateOfBirth: true, birthPlace: true, passportNumber: true } },
  host: { select: { id: true, firstName: true, lastName: true, email: true, gender: true, dateOfBirth: true, birthPlace: true, passportNumber: true, lodgingSurface: true, currentOccupants: true } },
  hostDocuments: true,
};

// Strip raw document URLs — replace with boolean presence flags for students/hosts
const sanitizeDocPaths = ({ universityNoticePath, passportPath, aviPath, hostDocuments, ...rest }) => ({
  ...rest,
  hasUniversityNotice: !!universityNoticePath,
  hasPassport: !!passportPath,
  hasAvi: !!aviPath,
  // Host documents: strip filePath from each doc for student view
  hostDocuments: (hostDocuments || []).map(({ filePath, ...doc }) => doc),
});

const forRole = (role, dossier) =>
  (role === 'admin') ? dossier : sanitizeDocPaths(dossier);

const list = async (req, res) => {
  try {
    const { user } = req;
    let where = {};
    if (user.role === 'student') where = { studentId: user.id };
    else if (user.role === 'host') where = { hostId: user.id };

    const { status, search } = req.query;
    if (status) where.status = status;
    if (search && user.role === 'admin') {
      where.OR = [
        { student: { firstName: { contains: search, mode: 'insensitive' } } },
        { student: { lastName: { contains: search, mode: 'insensitive' } } },
        { student: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const dossiers = await prisma.dossier.findMany({
      where,
      select: dossierSelect,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ dossiers: dossiers.map(d => forRole(user.role, d)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des dossiers' });
  }
};

const getOne = async (req, res) => {
  try {
    const { user } = req;
    const dossier = await prisma.dossier.findUnique({
      where: { id: req.params.id },
      select: dossierSelect,
    });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });

    if (user.role === 'student' && dossier.student.id !== user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (user.role === 'host' && dossier.host?.id !== user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json({ dossier: forRole(user.role, dossier) });
  } catch (err) {
    console.error('getOne error:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  try {
    const { user } = req;
    let studentId = user.id;

    if (user.role === 'admin' && req.body.studentId) {
      studentId = req.body.studentId;
    } else if (user.role !== 'student' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Seuls les étudiants peuvent créer un dossier' });
    }

    if (user.role === 'student') {
      const existing = await prisma.dossier.findFirst({
        where: { studentId, status: { not: 'confirmed' } },
      });
      if (existing) return res.status(409).json({ error: 'Vous avez déjà un dossier en cours' });
    }

    const uploadFile = async (fileArr, folder) => {
      if (!fileArr?.[0]) return null;
      const r = await uploadToCloudinary(fileArr[0].buffer, { folder });
      return r.secure_url;
    };

    const [universityNoticePath, passportPath, aviPath] = await Promise.all([
      uploadFile(req.files?.universityNotice, 'aegl/student-docs'),
      uploadFile(req.files?.passport, 'aegl/student-docs'),
      uploadFile(req.files?.avi, 'aegl/student-docs'),
    ]);

    if (!universityNoticePath || !passportPath || !aviPath) {
      return res.status(400).json({ error: 'L\'accord préalable, le passeport et l\'AVI sont obligatoires' });
    }

    const dossier = await prisma.dossier.create({
      data: { studentId, universityNoticePath, passportPath, aviPath },
      select: dossierSelect,
    });
    await logActivity(user.id, 'create_dossier', { dossierId: dossier.id });
    res.status(201).json({ dossier: forRole(user.role, dossier) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la création du dossier' });
  }
};

const assignHost = async (req, res) => {
  try {
    const { hostId } = req.body;
    if (!hostId) return res.status(400).json({ error: 'hostId requis' });

    const host = await prisma.user.findUnique({ where: { id: hostId } });
    if (!host || host.role !== 'host') {
      return res.status(404).json({ error: 'Hébergeur introuvable' });
    }

    const dossier = await prisma.dossier.findUnique({ where: { id: req.params.id } });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });
    if (dossier.status !== 'pending') {
      return res.status(400).json({ error: 'Ce dossier ne peut pas recevoir d\'hébergeur dans son état actuel' });
    }
    if (!dossier.studentDocsVerified) {
      return res.status(400).json({ error: 'Les documents de l\'étudiant doivent être vérifiés avant d\'assigner un hébergeur' });
    }

    const updated = await prisma.dossier.update({
      where: { id: req.params.id },
      data: { hostId, status: 'host_assigned' },
      select: dossierSelect,
    });
    await logActivity(req.user.id, 'assign_host', { dossierId: req.params.id, hostId });
    res.json({ dossier: updated });
    // Email envoyé en arrière-plan
    sendHostAssignedEmail(host, updated.student)
      .catch(err => console.error('sendHostAssignedEmail failed:', err.message));
  } catch (err) {
    console.error('assignHost error:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
};

const revokeHost = async (req, res) => {
  try {
    const dossier = await prisma.dossier.findUnique({ where: { id: req.params.id } });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });

    // Si le dossier est déjà livré ou plus avancé, on retire juste l'hébergeur sans toucher au statut
    const advancedStatuses = ['documents_ready', 'confirmed'];
    const newStatus = advancedStatuses.includes(dossier.status) ? dossier.status : 'pending';

    const updated = await prisma.dossier.update({
      where: { id: req.params.id },
      data: { hostId: null, status: newStatus },
      select: dossierSelect,
    });
    await logActivity(req.user.id, 'revoke_host', { dossierId: req.params.id });
    res.json({ dossier: updated });
  } catch (err) {
    console.error('revokeHost error:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
};

const validateDocs = async (req, res) => {
  try {
    const dossier = await prisma.dossier.findUnique({
      where: { id: req.params.id },
      include: { hostDocuments: true },
    });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });
    if (dossier.status !== 'documents_provided') {
      return res.status(400).json({ error: 'Documents non soumis ou déjà vérifiés' });
    }

    await prisma.hostDocument.updateMany({
      where: { dossierId: req.params.id },
      data: { verified: true },
    });

    const updated = await prisma.dossier.update({
      where: { id: req.params.id },
      data: { status: 'documents_verified' },
      select: dossierSelect,
    });
    await logActivity(req.user.id, 'validate_docs', { dossierId: req.params.id });
    res.json({ dossier: updated });
  } catch (err) {
    console.error('validateDocs error:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
};

const rejectDocs = async (req, res) => {
  try {
    const { reason } = req.body;
    const updated = await prisma.dossier.update({
      where: { id: req.params.id },
      data: {
        status: 'host_assigned',
        adminNotes: reason || 'Documents rejetés par l\'administration',
      },
      select: dossierSelect,
    });
    await logActivity(req.user.id, 'reject_docs', { dossierId: req.params.id, reason });
    res.json({ dossier: updated });
  } catch (err) {
    console.error('rejectDocs error:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
};

// Admin : génère l'attestation, l'envoie à l'hébergeur pour signature
const close = async (req, res) => {
  try {
    const dossier = await prisma.dossier.findUnique({
      where: { id: req.params.id },
      include: { student: true, host: true, hostDocuments: true },
    });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });
    if (dossier.status !== 'documents_verified') {
      return res.status(400).json({ error: 'Les documents doivent être vérifiés avant clôture' });
    }
    if (!dossier.host) {
      return res.status(400).json({ error: 'Aucun hébergeur assigné à ce dossier' });
    }

    // Générer l'attestation PDF et l'uploader sur Cloudinary
    const pdfBuffer = await generateAttestationBuffer(dossier);
    const attestationUrl = await uploadBuffer(
      pdfBuffer,
      'aegl/attestations',
      `attestation_${req.params.id}_${Date.now()}`
    );

    const updated = await prisma.dossier.update({
      where: { id: req.params.id },
      data: { status: 'attestation_pending', attestationPath: attestationUrl },
      select: dossierSelect,
    });

    await logActivity(req.user.id, 'close_dossier', { dossierId: req.params.id });
    res.json({ dossier: updated });
    // Email envoyé en arrière-plan — ne bloque pas la réponse HTTP
    sendAttestationToHostEmail(dossier.host, dossier.student, dossier.id, pdfBuffer)
      .catch(err => console.error('sendAttestationToHostEmail failed:', err.message));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la clôture du dossier' });
  }
};

// Hébergeur : soumet sa signature → fusionne tout et envoie à l'étudiant
const signAttestation = async (req, res) => {
  try {
    const { user } = req;
    const dossier = await prisma.dossier.findUnique({
      where: { id: req.params.id },
      include: { student: true, host: true, hostDocuments: true },
    });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });
    if (dossier.hostId !== user.id) return res.status(403).json({ error: 'Accès refusé' });
    if (dossier.status !== 'attestation_pending') {
      return res.status(400).json({ error: 'Aucune attestation en attente de signature' });
    }
    if (!req.file) return res.status(400).json({ error: 'Signature manquante' });

    const { PDFDocument } = require('pdf-lib');

    // 1. Re-générer l'attestation (plus fiable que de la re-télécharger depuis Cloudinary)
    const attestBuf = await generateAttestationBuffer(dossier);

    // 2. Intégrer la signature PNG directement depuis le buffer multer (pas besoin de Cloudinary)
    const pdfDoc = await PDFDocument.load(attestBuf);
    const sigImg = await pdfDoc.embedPng(req.file.buffer).catch(() => pdfDoc.embedJpg(req.file.buffer));
    const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
    const { width } = lastPage.getSize();
    const sigDims = sigImg.scale(0.35);
    lastPage.drawImage(sigImg, {
      x: width - sigDims.width - 70,
      y: 115,
      width: sigDims.width,
      height: sigDims.height,
    });
    const signedAttestation = Buffer.from(await pdfDoc.save());

    // 3. Résoudre les URLs des documents hébergeur (signées si authenticated)
    const resolveUrl = (storedUrl) => {
      if (!storedUrl) return null;
      if (storedUrl.includes('/authenticated/')) {
        const m = storedUrl.match(/cloudinary\.com\/[^/]+\/([^/]+)\/authenticated\/(?:s--[^/]+--\/)?(?:v\d+\/)?(.+)$/);
        if (!m) return storedUrl;
        const resourceType = m[1];
        let publicId = m[2];
        if (resourceType !== 'raw') publicId = publicId.replace(/\.[^.]+$/, '');
        return getSignedUrl(publicId, resourceType);
      }
      return storedUrl;
    };

    const hostDocUrls = dossier.hostDocuments.map(d => resolveUrl(d.filePath)).filter(Boolean);

    // 4. Fusionner attestation signée + documents hébergeur
    const mergedBuffer = await mergeDocuments(signedAttestation, hostDocUrls);

    // 5. Uploader le PDF fusionné sur Cloudinary
    const mergedUrl = await uploadBuffer(
      mergedBuffer,
      'aegl/dossiers-complets',
      `dossier_complet_${dossier.id}_${Date.now()}`
    );

    // 6. Supprimer les enregistrements des documents hébergeur
    await prisma.hostDocument.deleteMany({ where: { dossierId: req.params.id } });

    // 7. Mettre à jour le dossier
    const updated = await prisma.dossier.update({
      where: { id: req.params.id },
      data: {
        status: 'confirmed',
        mergedPdfPath: mergedUrl,
        closedAt: new Date(),
        universityNoticePath: null,
        passportPath: null,
        aviPath: null,
        attestationPath: null,
      },
      select: dossierSelect,
    });

    await logActivity(user.id, 'sign_attestation', { dossierId: req.params.id });
    res.json({ dossier: updated });
    // Email + suppression Cloudinary en arrière-plan
    sendMergedDossierEmail(dossier.student, mergedBuffer)
      .catch(err => console.error('sendMergedDossierEmail failed:', err.message));
    [dossier.universityNoticePath, dossier.passportPath, dossier.aviPath, dossier.attestationPath,
      ...dossier.hostDocuments.map(d => d.filePath)].forEach(deleteCloudinaryFile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la signature' });
  }
};

const updateNotes = async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const dossier = await prisma.dossier.findUnique({ where: { id: req.params.id } });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });
    const updated = await prisma.dossier.update({
      where: { id: req.params.id },
      data: { adminNotes },
      select: dossierSelect,
    });
    res.json({ dossier: updated });
  } catch (err) {
    console.error('updateNotes error:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
};

const stats = async (req, res) => {
  try {
    const [total, pending, hostAssigned, docsProvided, docsVerified, attestationPending, confirmed] = await Promise.all([
      prisma.dossier.count(),
      prisma.dossier.count({ where: { status: 'pending' } }),
      prisma.dossier.count({ where: { status: 'host_assigned' } }),
      prisma.dossier.count({ where: { status: 'documents_provided' } }),
      prisma.dossier.count({ where: { status: 'documents_verified' } }),
      prisma.dossier.count({ where: { status: 'attestation_pending' } }),
      prisma.dossier.count({ where: { status: 'confirmed' } }),
    ]);
    const totalStudents = await prisma.user.count({ where: { role: 'student' } });
    const totalHosts = await prisma.user.count({ where: { role: 'host' } });
    res.json({ total, pending, hostAssigned, docsProvided, docsVerified, attestationPending, confirmed, totalStudents, totalHosts });
  } catch (err) {
    console.error('stats error:', err);
    res.status(500).json({ error: err.message || 'Erreur statistiques' });
  }
};

const verifyStudentDocs = async (req, res) => {
  try {
    const updated = await prisma.dossier.update({
      where: { id: req.params.id },
      data: { studentDocsVerified: true, studentDocsRejectedReason: null },
      select: dossierSelect,
    });
    await logActivity(req.user.id, 'verify_student_docs', { dossierId: req.params.id });
    res.json({ dossier: updated });
  } catch (err) {
    console.error('verifyStudentDocs error:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
};

const rejectStudentDocs = async (req, res) => {
  try {
    const { reason } = req.body;
    const updated = await prisma.dossier.update({
      where: { id: req.params.id },
      data: { studentDocsVerified: false, studentDocsRejectedReason: reason || 'Documents non conformes' },
      select: dossierSelect,
    });
    await logActivity(req.user.id, 'reject_student_docs', { dossierId: req.params.id });
    res.json({ dossier: updated });
  } catch (err) {
    console.error('rejectStudentDocs error:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
};

const resubmitStudentDocs = async (req, res) => {
  try {
    const { user } = req;
    const dossier = await prisma.dossier.findUnique({ where: { id: req.params.id } });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });
    if (dossier.studentId !== user.id) return res.status(403).json({ error: 'Accès refusé' });
    if (dossier.status !== 'pending' || dossier.studentDocsVerified) {
      return res.status(400).json({ error: 'La re-soumission n\'est possible que si vos documents ont été refusés' });
    }

    const uploadFile = async (fileArr, folder) => {
      if (!fileArr?.[0]) return null;
      const r = await uploadToCloudinary(fileArr[0].buffer, { folder });
      return r.secure_url;
    };

    const [universityNoticePath, passportPath, aviPath] = await Promise.all([
      uploadFile(req.files?.universityNotice, 'aegl/student-docs'),
      uploadFile(req.files?.passport, 'aegl/student-docs'),
      uploadFile(req.files?.avi, 'aegl/student-docs'),
    ]);

    if (!universityNoticePath || !passportPath || !aviPath) {
      return res.status(400).json({ error: 'Les 3 documents sont obligatoires' });
    }

    const updated = await prisma.dossier.update({
      where: { id: req.params.id },
      data: { universityNoticePath, passportPath, aviPath, studentDocsRejectedReason: null },
      select: dossierSelect,
    });
    await logActivity(user.id, 'resubmit_student_docs', { dossierId: req.params.id });
    res.json({ dossier: forRole(user.role, updated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la re-soumission' });
  }
};

// Admin uploads a ready-made attestation PDF + optional host docs → stored in student account (no email, no auto-generation)
const adminDirectDeliver = async (req, res) => {
  try {
    const { user } = req;
    const dossier = await prisma.dossier.findUnique({
      where: { id: req.params.id },
      include: { student: true, hostDocuments: true },
    });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });
    if (!dossier.studentDocsVerified) {
      return res.status(400).json({ error: 'Vérifiez d\'abord les documents de l\'étudiant' });
    }
    if (!['pending', 'host_assigned', 'documents_ready'].includes(dossier.status)) {
      return res.status(400).json({ error: 'Cette action n\'est disponible que pour les dossiers en attente, avec hébergeur assigné, ou en attente de confirmation' });
    }

    // Attestation PDF uploadée par l'admin est obligatoire
    const attestationFile = req.files?.['attestation']?.[0];
    if (!attestationFile) {
      return res.status(400).json({ error: 'L\'attestation PDF est obligatoire' });
    }

    // Supprimer l'ancien PDF fusionné et les anciens docs hébergeur si remplacement
    if (dossier.mergedPdfPath) deleteCloudinaryFile(dossier.mergedPdfPath);
    const existingDocs = await prisma.hostDocument.findMany({ where: { dossierId: dossier.id } });
    existingDocs.forEach(doc => deleteCloudinaryFile(doc.filePath));
    await prisma.hostDocument.deleteMany({ where: { dossierId: dossier.id } });

    // Collecter les buffers en mémoire ET uploader sur Cloudinary pour stockage
    const docTypes = ['bail', 'identity', 'quittance_1', 'quittance_2', 'quittance_3', 'facture_1', 'facture_2', 'facture_3'];
    const hostBuffers = [];
    const newDocs = [];
    for (const docType of docTypes) {
      const fileArr = req.files?.[docType];
      if (!fileArr?.[0]) continue;
      const buf = fileArr[0].buffer;
      hostBuffers.push(buf); // pour la fusion en mémoire (pas de limite Cloudinary)
      try {
        const r = await uploadToCloudinary(buf, { folder: 'aegl/host-docs', resource_type: 'raw' });
        newDocs.push({ dossierId: dossier.id, docType, filePath: r.secure_url, verified: true });
      } catch (uploadErr) {
        console.error(`adminDirectDeliver: upload Cloudinary échoué pour ${docType}:`, uploadErr.message);
      }
    }
    if (newDocs.length > 0) {
      await prisma.hostDocument.createMany({ data: newDocs });
    }

    // Fusionner directement depuis les buffers en mémoire (aucun re-téléchargement Cloudinary)
    console.log(`[adminDirectDeliver] fusion: attestation=${attestationFile.buffer.length} octets, ${hostBuffers.length} doc(s) hébergeur`);
    let finalBuffer;
    try {
      finalBuffer = hostBuffers.length > 0
        ? await mergeFromBuffers(attestationFile.buffer, hostBuffers)
        : attestationFile.buffer;
      console.log(`[adminDirectDeliver] fusion OK: ${finalBuffer.length} octets`);
    } catch (mergeErr) {
      console.error('[adminDirectDeliver] ERREUR fusion:', mergeErr.message);
      return res.status(500).json({ error: `Erreur lors de la fusion des PDFs: ${mergeErr.message}` });
    }

    let mergedUrl;
    try {
      mergedUrl = await uploadBuffer(
        finalBuffer,
        'aegl/dossiers-complets',
        `dossier_complet_${dossier.id}_${Date.now()}`
      );
      console.log(`[adminDirectDeliver] upload PDF fusionné OK: ${mergedUrl}`);
    } catch (uploadFinalErr) {
      console.error('[adminDirectDeliver] ERREUR upload PDF fusionné:', uploadFinalErr.message);
      const isTooBig = uploadFinalErr.message?.toLowerCase().includes('file size too large') || uploadFinalErr.message?.toLowerCase().includes('too large');
      return res.status(500).json({
        error: isTooBig
          ? `Le PDF fusionné est trop volumineux pour Cloudinary (limite 10 MB). Compressez les documents sur ilovepdf.com avant de les uploader.`
          : `Erreur lors de l'upload du PDF final: ${uploadFinalErr.message}`
      });
    }

    const updated = await prisma.dossier.update({
      where: { id: dossier.id },
      data: { status: 'documents_ready', mergedPdfPath: mergedUrl, hostId: null },
      select: dossierSelect,
    });

    await logActivity(user.id, 'admin_direct_deliver', { dossierId: dossier.id });
    res.json({ dossier: updated });
  } catch (err) {
    console.error('[adminDirectDeliver] ERREUR globale:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
};

const studentConfirmDossier = async (req, res) => {
  try {
    const { user } = req;
    const dossier = await prisma.dossier.findUnique({
      where: { id: req.params.id },
      include: { hostDocuments: true },
    });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });
    if (dossier.studentId !== user.id) return res.status(403).json({ error: 'Accès refusé' });
    if (dossier.status !== 'documents_ready') {
      return res.status(400).json({ error: 'Aucun document en attente de confirmation' });
    }

    // Supprimer les enregistrements des documents hébergeur
    await prisma.hostDocument.deleteMany({ where: { dossierId: req.params.id } });

    const updated = await prisma.dossier.update({
      where: { id: req.params.id },
      data: {
        status: 'confirmed',
        closedAt: new Date(),
        hostId: null,
        universityNoticePath: null,
        passportPath: null,
        aviPath: null,
        attestationPath: null,
      },
      select: dossierSelect,
    });
    await logActivity(user.id, 'student_confirm_dossier', { dossierId: req.params.id });
    res.json({ dossier: updated });

    // Suppression Cloudinary en arrière-plan (fire-and-forget)
    [dossier.universityNoticePath, dossier.passportPath, dossier.aviPath, dossier.attestationPath,
      ...dossier.hostDocuments.map(d => d.filePath)].forEach(deleteCloudinaryFile);
  } catch (err) {
    console.error('studentConfirmDossier error:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    const dossier = await prisma.dossier.findUnique({ where: { id: req.params.id } });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });
    await prisma.dossier.delete({ where: { id: req.params.id } });
    await logActivity(req.user.id, 'delete_dossier', { dossierId: req.params.id });
    res.json({ message: 'Dossier supprimé avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { list, getOne, create, assignHost, revokeHost, validateDocs, rejectDocs, close, signAttestation, updateNotes, stats, remove, verifyStudentDocs, rejectStudentDocs, resubmitStudentDocs, adminDirectDeliver, studentConfirmDossier };
