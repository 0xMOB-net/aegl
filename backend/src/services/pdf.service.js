const PDFDocument = require('pdfkit');

const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const civilite = (gender) => gender === 'F' ? 'Mme' : 'M.';
const accord = (gender, m, f) => gender === 'F' ? f : m;

const buildAttestationText = (dossier) => {
  const { host, student, hostAddress } = dossier;
  const address = hostAddress || 'Limoges, France';

  const hostDob = host.dateOfBirth ? `né${accord(host.gender, '', 'e')} le ${formatDate(host.dateOfBirth)}` : '';
  const hostBirth = host.birthPlace ? ` à ${host.birthPlace}` : '';
  const hostDobbirth = hostDob ? `${hostDob}${hostBirth}` : '';

  const studentDob = student.dateOfBirth ? `né${accord(student.gender, '', 'e')} le ${formatDate(student.dateOfBirth)}` : '';
  const studentBirth = student.birthPlace ? ` à ${student.birthPlace}` : '';
  const studentDobbirth = studentDob ? `${studentDob}${studentBirth}` : '';

  const hostLine = [
    `Je soussigné${accord(host.gender, '', 'e')}, ${civilite(host.gender)} ${host.firstName.toUpperCase()} ${host.lastName.toUpperCase()}`,
    hostDobbirth,
    `demeurant à l'adresse : ${address}`,
  ].filter(Boolean).join(', ');

  const studentLine = [
    `${student.firstName.toUpperCase()} ${student.lastName.toUpperCase()}`,
    studentDobbirth,
    'de nationalité guinéenne',
  ].filter(Boolean).join(', ');

  return [
    `${hostLine},`,
    '',
    `m'engage à héberger à titre gracieux à mon domicile ${accord(student.gender, 'M.', 'Mme')} ${studentLine}, dès son arrivée en France et jusqu'à l'obtention d'un nouveau logement.`,
    '',
    `Pièces jointes : mon titre de séjour et les justificatifs de domicile.`,
    '',
    `En foi de quoi je lui délivre la présente attestation pour servir et valoir ce que de droit.`,
  ].join('\n');
};

const generateAttestationBuffer = (dossier) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 80, bottom: 80, left: 70, right: 70 } });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const today = new Date();

      // Titre
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('ATTESTATION D\'HÉBERGEMENT', { align: 'center', underline: true })
         .moveDown(3);

      // Corps
      const bodyText = buildAttestationText(dossier);
      doc.fontSize(12).font('Helvetica').text(bodyText, { align: 'justify', lineGap: 6 });

      doc.moveDown(4);

      // Date et lieu
      doc.fontSize(11).text(`Fait à Limoges, le ${formatDate(today)}`, { align: 'right' });
      doc.moveDown(0.5);
      doc.text(`${dossier.host.firstName.toUpperCase()} ${dossier.host.lastName.toUpperCase()}`, { align: 'right' });

      doc.moveDown(4);

      // Ligne de signature
      const sigLineX = doc.page.margins.left + pageWidth * 0.55;
      const sigLineY = doc.y;
      doc.moveTo(sigLineX, sigLineY)
         .lineTo(sigLineX + pageWidth * 0.38, sigLineY)
         .strokeColor('#000000')
         .lineWidth(0.5)
         .stroke();
      doc.fontSize(9).text('Signature', { align: 'right' });

      // Pied de page discret
      const bottomY = doc.page.height - doc.page.margins.bottom + 25;
      doc.fontSize(7)
         .fillColor('#888888')
         .text(
           `Document généré par l'AEGL — Réf. dossier : ${dossier.id.substring(0, 8).toUpperCase()}`,
           doc.page.margins.left, bottomY,
           { align: 'center', width: pageWidth }
         );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateAttestationBuffer };
