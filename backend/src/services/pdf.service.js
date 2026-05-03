const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { variants, selectVariant, formatDate } = require('../utils/attestation.variants');

/**
 * Génère une attestation PDF pour un dossier donné.
 * La variante sélectionnée est déterministe (basée sur l'ID du dossier).
 * @param {Object} dossier - Le dossier avec student, host, hostDocuments
 * @returns {string} chemin relatif vers le PDF généré
 */
const generateAttestation = async (dossier) => {
  return new Promise((resolve, reject) => {
    try {
      const outputDir = path.resolve(process.env.PDF_OUTPUT_DIR || './pdfs');
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      const filename = `attestation_${dossier.id}.pdf`;
      const outputPath = path.join(outputDir, filename);

      // Sélection déterministe de la variante
      const variantIndex = selectVariant(dossier.id);
      const variantFn = variants[variantIndex];

      // Construire l'adresse depuis les documents hébergeur
      // (on l'extrait de la BDD ou on utilise un placeholder)
      const address = dossier.hostAddress || 'Limoges, France';
      const today = new Date();

      // Générer le texte de l'attestation
      const bodyText = variantFn({
        host: dossier.host,
        student: dossier.student,
        address,
        dossierId: dossier.id,
        date: today,
      });

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 80, bottom: 80, left: 70, right: 70 },
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // === EN-TÊTE ===
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#000000')
         .text('ASSOCIATION DES ÉTUDIANTS GUINÉENS DE LIMOGES', { align: 'center' })
         .text('AEGL', { align: 'center' })
         .moveDown(0.3)
         .text('Email : contact@aegl87.fr', { align: 'center' })
         .moveDown(2);

      // === TITRE ===
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('ATTESTATION D\'HÉBERGEMENT', { align: 'center', underline: true })
         .moveDown(2);

      // === CORPS ===
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#000000');

      // Nettoyer et découper le texte en paragraphes
      const paragraphs = bodyText.trim().split('\n\n').filter(p => p.trim());
      paragraphs.forEach((paragraph, i) => {
        const cleanParagraph = paragraph.trim();
        if (!cleanParagraph) return;

        // Détecter les sous-titres (ligne seule en majuscules)
        if (cleanParagraph === cleanParagraph.toUpperCase() && cleanParagraph.length < 60) {
          doc.font('Helvetica-Bold')
             .text(cleanParagraph, { align: 'center' })
             .font('Helvetica');
        } else {
          doc.text(cleanParagraph, {
            align: 'justify',
            lineGap: 4,
          });
        }
        if (i < paragraphs.length - 1) doc.moveDown(1);
      });

      // === DATE ET SIGNATURE ===
      doc.moveDown(3);
      const dateText = `Fait à Limoges, le ${formatDate(today)}`;
      doc.fontSize(11)
         .text(dateText, { align: 'right' })
         .moveDown(0.5);

      doc.fontSize(11)
         .text(`${dossier.host.firstName} ${dossier.host.lastName}`, { align: 'right' })
         .moveDown(3);

      // Ligne de signature
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const sigLineX = doc.page.margins.left + pageWidth * 0.6;
      const sigLineY = doc.y;
      doc.moveTo(sigLineX, sigLineY)
         .lineTo(sigLineX + pageWidth * 0.35, sigLineY)
         .strokeColor('#000000')
         .stroke();

      doc.fontSize(9)
         .text('Signature', { align: 'right' });

      // === PIED DE PAGE ===
      const bottomY = doc.page.height - doc.page.margins.bottom + 20;
      doc.fontSize(8)
         .fillColor('#555555')
         .text(
           `Document généré par l'AEGL — N° dossier : ${dossier.id.substring(0, 8).toUpperCase()}`,
           doc.page.margins.left,
           bottomY,
           { align: 'center', width: pageWidth }
         );

      doc.end();

      stream.on('finish', () => resolve(`/pdfs/${filename}`));
      stream.on('error', reject);

    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateAttestation };
