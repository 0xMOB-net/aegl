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

const R = 'Times-Roman';
const B = 'Times-Bold';

const generateAttestationBuffer = (dossier) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 130, bottom: 80, left: 85, right: 85 },
      });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const { host, student, hostAddress } = dossier;
      const address = hostAddress || 'Limoges, France';
      const today   = new Date();

      const hostE = host.gender    === 'F' ? 'e' : '';
      const stuE  = student.gender === 'F' ? 'e' : '';

      const hostDobStr   = host.dateOfBirth    ? shortDate(host.dateOfBirth)    : '';
      const hostBirth    = host.birthPlace     ? ` à ${host.birthPlace}`        : '';
      const stuDobStr    = student.dateOfBirth ? shortDate(student.dateOfBirth) : '';
      const stuBirth     = student.birthPlace  ? ` à ${student.birthPlace}`     : '';
      const hasPassport  = !!student.passportNumber;

      // ── Titre ──────────────────────────────────────────────────────────
      doc.fontSize(13).font(B)
         .text("ATTESTATION D'HÉBERGEMENT", { align: 'center' })
         .moveDown(2.8);

      // ── Corps — inline bold sur noms / dates / mots-clés ──────────────
      const fs = 12;
      const opts = { continued: true, lineGap: 5, align: 'justify' };
      const last = { lineGap: 5, align: 'justify' };

      doc.fontSize(fs)
         .font(R).text(`Je soussigné${hostE} `, opts)
         .font(B).text(`${host.lastName} ${host.firstName}`, opts)
         .font(R).text(hostDobStr ? `, né${hostE} le ` : '', opts)
         .font(B).text(hostDobStr, opts)
         .font(R).text(`${hostBirth}, m'engage à accueillir à mon domicile `, opts)
         .font(B).text(`${student.lastName} ${student.firstName}`, opts)
         .font(R).text(stuDobStr ? `, né${stuE} le ` : '', opts)
         .font(B).text(stuDobStr, opts)
         .font(R).text(`${stuBirth}, de nationalité `, opts)
         .font(B).text('guinéenne', opts);

      if (hasPassport) {
        doc.font(R).text(', titulaire du passeport N° ', opts)
           .font(B).text(student.passportNumber, opts)
           .font(R).text(', dès son arrivée en France à l\'adresse suivante :', last);
      } else {
        doc.font(R).text(', dès son arrivée en France à l\'adresse suivante :', last);
      }

      // ── Adresse ────────────────────────────────────────────────────────
      doc.moveDown(1.4)
         .fontSize(fs).font(R)
         .text(`${address}.`, { align: 'left' });

      // ── Date et nom hébergeur ──────────────────────────────────────────
      doc.moveDown(5.5)
         .fontSize(fs).font(B)
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
