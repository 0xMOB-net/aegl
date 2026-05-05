const PDFDocument = require('pdfkit');
const { variants, selectVariant, formatDate } = require('../utils/attestation.variants');

const buildPdfContent = (doc, dossier) => {
  const variantIndex = selectVariant(dossier.id);
  const variantFn = variants[variantIndex];
  const address = dossier.hostAddress || 'Limoges, France';
  const today = new Date();

  const bodyText = variantFn({
    host: dossier.host,
    student: dossier.student,
    address,
    dossierId: dossier.id,
    date: today,
  });

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#000000')
     .text('ASSOCIATION DES ÉTUDIANTS GUINÉENS DE LIMOGES', { align: 'center' })
     .text('AEGL', { align: 'center' })
     .moveDown(0.3)
     .text('Email : contact@aegl87.fr', { align: 'center' })
     .moveDown(2);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#000000')
     .text('ATTESTATION D\'HÉBERGEMENT', { align: 'center', underline: true })
     .moveDown(2);

  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#000000');

  const paragraphs = bodyText.trim().split('\n\n').filter(p => p.trim());
  paragraphs.forEach((paragraph, i) => {
    const cleanParagraph = paragraph.trim();
    if (!cleanParagraph) return;
    if (cleanParagraph === cleanParagraph.toUpperCase() && cleanParagraph.length < 60) {
      doc.font('Helvetica-Bold').text(cleanParagraph, { align: 'center' }).font('Helvetica');
    } else {
      doc.text(cleanParagraph, { align: 'justify', lineGap: 4 });
    }
    if (i < paragraphs.length - 1) doc.moveDown(1);
  });

  doc.moveDown(3);
  doc.fontSize(11)
     .text(`Fait à Limoges, le ${formatDate(today)}`, { align: 'right' })
     .moveDown(0.5);

  doc.fontSize(11)
     .text(`${dossier.host.firstName} ${dossier.host.lastName}`, { align: 'right' })
     .moveDown(3);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const sigLineX = doc.page.margins.left + pageWidth * 0.6;
  const sigLineY = doc.y;
  doc.moveTo(sigLineX, sigLineY)
     .lineTo(sigLineX + pageWidth * 0.35, sigLineY)
     .strokeColor('#000000')
     .stroke();

  doc.fontSize(9).text('Signature', { align: 'right' });

  const bottomY = doc.page.height - doc.page.margins.bottom + 20;
  doc.fontSize(8)
     .fillColor('#555555')
     .text(
       `Document généré par l'AEGL — N° dossier : ${dossier.id.substring(0, 8).toUpperCase()}`,
       doc.page.margins.left,
       bottomY,
       { align: 'center', width: pageWidth }
     );
};

const generateAttestationBuffer = (dossier) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 80, bottom: 80, left: 70, right: 70 } });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      buildPdfContent(doc, dossier);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateAttestationBuffer };
