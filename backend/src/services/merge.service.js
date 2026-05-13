const { PDFDocument } = require('pdf-lib');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Télécharge un fichier depuis une URL Cloudinary (signée ou publique)
const fetchBuffer = async (url) => {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  return Buffer.from(res.data);
};

// Vérifie si un buffer est un PDF valide
const isPdf = (buf) => buf.slice(0, 4).toString() === '%PDF';

// Fusionne : [attestationBuffer, ...hostDocBuffers] → un seul PDF
const mergeDocuments = async (attestationBuffer, hostDocUrls) => {
  const merged = await PDFDocument.create();

  // 1. Ajouter l'attestation signée (déjà un PDF pdfkit)
  const attestDoc = await PDFDocument.load(attestationBuffer);
  const attestPages = await merged.copyPages(attestDoc, attestDoc.getPageIndices());
  attestPages.forEach(p => merged.addPage(p));

  // 2. Télécharger tous les docs hébergeur EN PARALLÈLE (au lieu de séquentiellement)
  const buffers = await Promise.all(
    hostDocUrls.map(url =>
      fetchBuffer(url).catch(err => {
        console.error(`merge.service: failed to fetch ${url}:`, err.message);
        return null;
      })
    )
  );

  // 3. Intégrer chaque buffer dans le PDF fusionné
  for (const buf of buffers) {
    if (!buf) continue;
    try {
      if (isPdf(buf)) {
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      } else {
        // Image (JPG / PNG) → nouvelle page A4
        const page = merged.addPage([595, 842]);
        let img;
        try {
          img = await merged.embedPng(buf).catch(() => merged.embedJpg(buf));
        } catch {
          img = await merged.embedJpg(buf);
        }
        const { width: imgW, height: imgH } = img.scale(1);
        const pageW = 595, pageH = 842;
        const margin = 30;
        const maxW = pageW - margin * 2;
        const maxH = pageH - margin * 2;
        const scale = Math.min(maxW / imgW, maxH / imgH, 1);
        const drawW = imgW * scale, drawH = imgH * scale;
        page.drawImage(img, {
          x: (pageW - drawW) / 2,
          y: (pageH - drawH) / 2,
          width: drawW,
          height: drawH,
        });
      }
    } catch (err) {
      console.error('merge.service: failed to embed buffer:', err.message);
    }
  }

  return Buffer.from(await merged.save());
};

// Upload un buffer vers Cloudinary (authenticated) et retourne le secure_url
const uploadBuffer = (buffer, folder, publicId) =>
  new Promise((resolve, reject) => {
    const { Readable } = require('stream');
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: 'raw', type: 'authenticated' },
      (err, result) => { if (err) reject(err); else resolve(result.secure_url); }
    );
    Readable.from(buffer).pipe(stream);
  });

module.exports = { mergeDocuments, uploadBuffer };
