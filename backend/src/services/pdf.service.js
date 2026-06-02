const PDFDocument = require('pdfkit');

const shortDate = (d) => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  const day   = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
};

const longDate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const generateAttestationBuffer = (dossier) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 120, bottom: 80, left: 80, right: 80 },
      });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const { host, student, hostAddress } = dossier;
      const address = hostAddress || 'Limoges, France';
      const today   = new Date();

      const hostE   = host.gender    === 'F' ? 'e' : '';
      const stuE    = student.gender === 'F' ? 'e' : '';

      const hostDob    = host.dateOfBirth    ? `, né${hostE} le ${shortDate(host.dateOfBirth)}`    : '';
      const hostBirth  = host.birthPlace     ? ` à ${host.birthPlace}`    : '';
      const stuDob     = student.dateOfBirth ? `, né${stuE} le ${shortDate(student.dateOfBirth)}` : '';
      const stuBirth   = student.birthPlace  ? ` à ${student.birthPlace}` : '';
      const passport   = student.passportNumber
        ? `, titulaire du passeport N° ${student.passportNumber}` : '';

      // ── Titre ──────────────────────────────────────────────────────────
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text("ATTESTATION D'HÉBERGEMENT", { align: 'center' })
         .moveDown(3);

      // ── Corps (noms en gras, texte justified) ──────────────────────────
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Je soussigné${hostE} `, { continued: true })
         .font('Helvetica-Bold')
         .text(`${host.lastName} ${host.firstName}`, { continued: true })
         .font('Helvetica')
         .text(
           `${hostDob}${hostBirth}, m'engage à accueillir à mon domicile `,
           { continued: true }
         )
         .font('Helvetica-Bold')
         .text(`${student.lastName} ${student.firstName}`, { continued: true })
         .font('Helvetica')
         .text(
           `${stuDob}${stuBirth}, de nationalité guinéenne${passport}, dès son arrivée en France à l'adresse suivante :`,
           { align: 'justify', lineGap: 6 }
         );

      // ── Adresse ────────────────────────────────────────────────────────
      doc.moveDown(1.5)
         .text(`${address}.`);

      // ── Date + nom hébergeur (bas droite) ──────────────────────────────
      doc.moveDown(5)
         .text(`Limoges, le ${longDate(today)}`, { align: 'right' })
         .moveDown(0.5)
         .text(`${host.lastName} ${host.firstName}`, { align: 'right' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateAttestationBuffer };
