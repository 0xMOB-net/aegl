const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

const sendDossierConfirmedEmail = async (student, pdfBuffer) => {
  const transporter = createTransporter();
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
      <strong>Votre attestation d'hébergement est disponible en pièce jointe de cet email.</strong><br>
      <small>Vous pouvez également la télécharger depuis votre espace membre sur aegl87.fr</small>
    </div>
    <p><strong>Prochaines étapes :</strong></p>
    <div class="steps">
      <div class="step"><div class="step-num">1</div><div>Téléchargez et conservez précieusement votre attestation</div></div>
      <div class="step"><div class="step-num">2</div><div>Présentez-la aux services administratifs de l'Université de Limoges</div></div>
      <div class="step"><div class="step-num">3</div><div>Confirmez la réception depuis votre espace membre AEGL</div></div>
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

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'AEGL'}" <${process.env.EMAIL_FROM}>`,
    to: student.email,
    subject: '✅ Votre attestation d\'hébergement AEGL est prête',
    html: htmlContent,
    attachments: [
      {
        filename: `Attestation_AEGL_${student.lastName}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
};

const sendWelcomeEmail = async (user) => {
  const transporter = createTransporter();
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
};

module.exports = { sendDossierConfirmedEmail, sendWelcomeEmail };
