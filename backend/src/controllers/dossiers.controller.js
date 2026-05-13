const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../services/activity.service');
const { sendAttestationToHostEmail, sendMergedDossierEmail } = require('../services/email.service');
const { generateAttestationBuffer } = require('../services/pdf.service');
const { mergeDocuments, uploadBuffer } = require('../services/merge.service');
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
  student: { select: { id: true, firstName: true, lastName: true, email: true, gender: true, dateOfBirth: true, birthPlace: true } },
  host: { select: { id: true, firstName: true, lastName: true, email: true, gender: true, dateOfBirth: true, birthPlace: true, lodgingSurface: true, currentOccupants: true } },
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
    res.status(500).json({ error: 'Erreur serveur' });
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
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const revokeHost = async (req, res) => {
  try {
    const dossier = await prisma.dossier.findUnique({ where: { id: req.params.id } });
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });

    const updated = await prisma.dossier.update({
      where: { id: req.params.id },
      data: { hostId: null, status: 'pending' },
      select: dossierSelect,
    });
    await logActivity(req.user.id, 'revoke_host', { dossierId: req.params.id });
    res.json({ dossier: updated });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
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
    res.status(500).json({ error: 'Erreur serveur' });
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
    res.status(500).json({ error: 'Erreur serveur' });
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

    // Envoyer l'attestation à l'hébergeur pour qu'il la signe
    await sendAttestationToHostEmail(dossier.host, dossier.student, dossier.id, pdfBuffer);
    await logActivity(req.user.id, 'close_dossier', { dossierId: req.params.id });
    res.json({ dossier: updated });
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
        const m = storedUrl.match(/cloudinary\.com\/[^/]+\/([^/]+)\/authenticated\/(?:v\d+\/)?(.+)$/);
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

    // 6. Mettre à jour le dossier
    const updated = await prisma.dossier.update({
      where: { id: req.params.id },
      data: { status: 'confirmed', mergedPdfPath: mergedUrl, closedAt: new Date() },
      select: dossierSelect,
    });

    // 7. Envoyer le PDF complet à l'étudiant par email
    await sendMergedDossierEmail(dossier.student, mergedBuffer);
    await logActivity(user.id, 'sign_attestation', { dossierId: req.params.id });
    res.json({ dossier: updated });
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
    res.status(500).json({ error: 'Erreur serveur' });
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
    res.status(500).json({ error: 'Erreur statistiques' });
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
    res.status(500).json({ error: 'Erreur serveur' });
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
    res.status(500).json({ error: 'Erreur serveur' });
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

module.exports = { list, getOne, create, assignHost, revokeHost, validateDocs, rejectDocs, close, signAttestation, updateNotes, stats, remove, verifyStudentDocs, rejectStudentDocs, resubmitStudentDocs };
