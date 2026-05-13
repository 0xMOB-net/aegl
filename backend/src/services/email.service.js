const nodemailer = require('nodemailer');

// Singleton réutilisé pour toutes les requêtes (évite de rouvrir une connexion TCP à chaque email)
let _transporter = null;
const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 3,
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 8000,
      socketTimeout: 15000,
    });
  }
  return _transporter;
};

const sendDossierConfirmedEmail = async (student, pdfBuffer, hostDocuments = []) => {
  const transporter = getTransporter();
  const fullName = `${student.firstName} ${student.lastName}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><style>
  body { font-family: Georgia, serif; background: #f9f9f9; color: #222; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .header { background: #1a5c3a; padding: 30px; text-align: center; }
  .header h1 { color: #FCD116; font-size: 22px; margin: 0 0 4px; }
  .header p { color: #9fd4b5; font-size: 13px; margin: 0; }
  .body { padding: 32px; }
  .body h2 { color: #1a5c3a; font-size: 18px; }
  .body p { line-height: 1.7; color: #444; }
  .highlight { background: #f0f8f4; border-left: 4px solid #1a5c3a; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
  .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888; }
  .steps { margin: 20px 0; }
  .step { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; }
  .step-num { background: #1a5c3a; color: #FCD116; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; flex-shrink: 0; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>🎓 AEGL</h1>
    <p>Association des Étudiants Guinéens de Limoges</p>
  </div>
  <div class="body">
    <h2>Félicitations, ${fullName} !</h2>
    <p>Nous avons le plaisir de vous informer que votre dossier d'hébergement a été <strong>validé et clôturé</strong> par l'équipe de l'AEGL.</p>
    <div class="highlight">
      <strong>Vos documents sont prêts et disponibles dans votre espace membre.</strong><br>
      <small>Connectez-vous sur aegl87.fr pour télécharger votre attestation d'hébergement.</small>
    </div>
    <p><strong>Prochaines étapes :</strong></p>
    <div class="steps">
      <div class="step"><div class="step-num">1</div><div>Connectez-vous à votre espace membre sur <a href="${process.env.FRONTEND_URL || 'https://aegl87.fr'}/membres" style="color:#1a5c3a">aegl87.fr</a></div></div>
      <div class="step"><div class="step-num">2</div><div>Téléchargez et conservez précieusement votre attestation d'hébergement</div></div>
      <div class="step"><div class="step-num">3</div><div>Présentez-la aux services administratifs de l'Université de Limoges</div></div>
    </div>
    <p>L'AEGL reste à votre disposition pour toute question. Nous vous souhaitons pleine réussite dans vos études !</p>
    <p>Cordialement,<br><strong>Le Bureau de l'AEGL</strong></p>
  </div>
  <div class="footer">
    <p>contact@aegl87.fr &bull; aegl87.fr<br>
    Association des Étudiants Guinéens de Limoges — Limoges, France</p>
  </div>
</div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'AEGL'}" <${process.env.EMAIL_FROM}>`,
      to: student.email,
      subject: '✅ Votre attestation d\'hébergement AEGL est prête',
      html: htmlContent,
      attachments: [],
    });
  } catch (err) {
    console.error('Email sending failed (dossierConfirmed):', err.message);
  }
};

const sendWelcomeEmail = async (user) => {
  const transporter = getTransporter();
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'AEGL'}" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: 'Bienvenue dans l\'espace membres AEGL',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto">
          <h2 style="color:#1a5c3a">Bienvenue, ${user.firstName} !</h2>
          <p>Votre compte AEGL a été créé avec succès. Vous pouvez maintenant vous connecter à votre espace membre.</p>
          <a href="${process.env.FRONTEND_URL}/login" style="background:#1a5c3a;color:#FCD116;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
            Se connecter
          </a>
          <p style="color:#888;font-size:12px;margin-top:20px">AEGL — contact@aegl87.fr</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Email sending failed (welcome):', err.message);
  }
};

const sendAttestationToHostEmail = async (host, student, dossierId, attestationBuffer) => {
  const transporter = getTransporter();
  const frontendUrl = process.env.FRONTEND_URL || 'https://aegl87.fr';
  const hostName = `${host.firstName} ${host.lastName}`;
  const studentName = `${student.firstName} ${student.lastName}`;

  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'AEGL'}" <${process.env.EMAIL_FROM}>`,
      to: host.email,
      subject: `✍️ Veuillez signer l'attestation d'hébergement pour ${studentName}`,
      html: `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>
  body { font-family: Georgia, serif; background: #f9f9f9; color: #222; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .header { background: #1a5c3a; padding: 30px; text-align: center; }
  .header h1 { color: #FCD116; font-size: 22px; margin: 0 0 4px; }
  .header p { color: #9fd4b5; font-size: 13px; margin: 0; }
  .body { padding: 32px; }
  .body h2 { color: #1a5c3a; }
  .body p { line-height: 1.7; color: #444; }
  .btn { display: inline-block; background: #1a5c3a; color: #FCD116 !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
  .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888; }
</style></head>
<body>
<div class="container">
  <div class="header"><h1>✍️ AEGL</h1><p>Association des Étudiants Guinéens de Limoges</p></div>
  <div class="body">
    <h2>Bonjour, ${hostName} !</h2>
    <p>L'administration de l'AEGL a validé tous les documents du dossier de <strong>${studentName}</strong>.</p>
    <p>L'attestation d'hébergement à votre nom a été générée. <strong>Vous devez la signer depuis votre espace membre</strong> avant qu'elle soit transmise à l'étudiant(e).</p>
    <p>L'attestation d'hébergement est jointe à cet email pour que vous puissiez la prévisualiser.</p>
    <a href="${frontendUrl}/membres" class="btn">✍️ Signer l'attestation →</a>
    <p style="color:#888;font-size:13px">Cette étape est obligatoire. Sans votre signature, l'étudiant(e) ne pourra pas recevoir son dossier complet.</p>
  </div>
  <div class="footer"><p>contact@aegl87.fr &bull; aegl87.fr</p></div>
</div>
</body></html>`,
      attachments: [
        {
          filename: `Attestation_hebergement_${studentName.replace(/\s/g, '_')}.pdf`,
          content: attestationBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  } catch (err) {
    console.error('Email sending failed (attestationToHost):', err.message);
  }
};

const sendMergedDossierEmail = async (student, mergedPdfBuffer) => {
  const transporter = getTransporter();
  const fullName = `${student.firstName} ${student.lastName}`;
  const frontendUrl = process.env.FRONTEND_URL || 'https://aegl87.fr';

  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'AEGL'}" <${process.env.EMAIL_FROM}>`,
      to: student.email,
      subject: '✅ Votre dossier complet d\'hébergement AEGL est prêt',
      html: `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>
  body { font-family: Georgia, serif; background: #f9f9f9; color: #222; margin: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .header { background: #1a5c3a; padding: 30px; text-align: center; }
  .header h1 { color: #FCD116; font-size: 22px; margin: 0 0 4px; }
  .header p { color: #9fd4b5; font-size: 13px; margin: 0; }
  .body { padding: 32px; }
  .highlight { background: #f0f8f4; border-left: 4px solid #1a5c3a; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
  .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888; }
</style></head>
<body>
<div class="container">
  <div class="header"><h1>🎓 AEGL</h1><p>Association des Étudiants Guinéens de Limoges</p></div>
  <div class="body">
    <h2 style="color:#1a5c3a">Félicitations, ${fullName} !</h2>
    <p>Votre dossier d'hébergement est <strong>complet et validé</strong>. Vous trouverez en pièce jointe un seul PDF contenant :</p>
    <div class="highlight">
      <ul style="margin:0;padding-left:20px;line-height:2">
        <li>L'attestation d'hébergement signée par votre hébergeur</li>
        <li>Le contrat de bail</li>
        <li>La pièce d'identité / titre de séjour de l'hébergeur</li>
        <li>Les 3 dernières quittances de loyer</li>
        <li>Les 3 factures nominatives</li>
      </ul>
    </div>
    <p>Présentez ce document complet auprès du consulat ou des services administratifs concernés.</p>
    <p>Cordialement,<br><strong>Le Bureau de l'AEGL</strong></p>
  </div>
  <div class="footer"><p>contact@aegl87.fr &bull; aegl87.fr</p></div>
</div>
</body></html>`,
      attachments: [
        {
          filename: `Dossier_complet_AEGL_${fullName.replace(/\s/g, '_')}.pdf`,
          content: mergedPdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  } catch (err) {
    console.error('Email sending failed (mergedDossier):', err.message);
  }
};

const sendContactEmail = async ({ name, email, topic, message }) => {
  const transporter = getTransporter();
  const subject = topic ? `[Contact AEGL] ${topic}` : '[Contact AEGL] Message depuis le site';

  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'AEGL'}" <${process.env.EMAIL_FROM}>`,
      to: process.env.CONTACT_EMAIL || 'contact@aegl87.fr',
      replyTo: `"${name}" <${email}>`,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#f9f9f9;padding:30px">
          <div style="background:#1a5c3a;padding:20px 30px;border-radius:8px 8px 0 0">
            <h2 style="color:#FCD116;margin:0;font-size:18px">📬 Nouveau message — Site AEGL</h2>
          </div>
          <div style="background:#fff;padding:30px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="color:#6b7280;padding:8px 0;width:120px">Nom</td><td style="font-weight:600;color:#111">${name}</td></tr>
              <tr><td style="color:#6b7280;padding:8px 0">Email</td><td><a href="mailto:${email}" style="color:#1a5c3a">${email}</a></td></tr>
              ${topic ? `<tr><td style="color:#6b7280;padding:8px 0">Sujet</td><td style="color:#111">${topic}</td></tr>` : ''}
            </table>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
            <p style="color:#374151;line-height:1.7;white-space:pre-wrap">${message}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
            <p style="color:#9ca3af;font-size:12px">
              Répondre directement à cet email répondra à <strong>${name}</strong> (${email}).
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Email sending failed (contact):', err.message);
    throw err;
  }
};

module.exports = { sendDossierConfirmedEmail, sendWelcomeEmail, sendAttestationToHostEmail, sendMergedDossierEmail, sendContactEmail };
