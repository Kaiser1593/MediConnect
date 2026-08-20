// backend/services/emailService.js
// Envoi des e-mails transactionnels (réinitialisation de mot de passe)
// via SMTP. Le transporteur est créé une seule fois et réutilisé.

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendPasswordResetEmail = async ({ to, firstname, resetUrl }) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Réinitialisation de votre mot de passe MediConnect",
    text:
      `Bonjour ${firstname},\n\n` +
      `Vous avez demandé la réinitialisation de votre mot de passe MediConnect.\n` +
      `Cliquez sur le lien suivant pour en choisir un nouveau (valable 1 heure) :\n${resetUrl}\n\n` +
      `Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.`,
    html:
      `<p>Bonjour ${firstname},</p>` +
      `<p>Vous avez demandé la réinitialisation de votre mot de passe MediConnect.</p>` +
      `<p><a href="${resetUrl}">Cliquez ici pour choisir un nouveau mot de passe</a> (lien valable 1 heure).</p>` +
      `<p>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.</p>`,
  });
};

module.exports = { sendPasswordResetEmail };
