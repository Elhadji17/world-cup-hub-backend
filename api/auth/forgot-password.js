// api/auth/forgot-password.js
// POST /api/auth/forgot-password
// Body : { email }
// Envoie un email avec un lien de réinitialisation

import crypto           from "crypto";
import { connectDB }    from "../../lib/mongodb.js";
import { User, PasswordResetToken } from "../../lib/models.js";
import { handleCors }   from "../../lib/auth.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FRONTEND_URL   = process.env.FRONTEND_URL ?? "https://world-cup-hub-kappa.vercel.app";

async function sendResetEmail(to, resetUrl) {
  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from: "World Cup Hub <onboarding@resend.dev>",
      to:      [to],
      subject: "⚽ Réinitialisation de ton mot de passe — World Cup Hub",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0f172a; color: white; padding: 32px; border-radius: 16px;">
          <h1 style="color: #4ade80; font-size: 24px; margin-bottom: 8px;">⚽ World Cup Hub</h1>
          <h2 style="font-size: 20px; margin-bottom: 16px;">Réinitialisation de mot de passe</h2>
          <p style="color: #94a3b8; margin-bottom: 24px;">
            Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous.
            Ce lien est valable <strong style="color: white;">1 heure</strong>.
          </p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px;
                    border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Réinitialiser mon mot de passe
          </a>
          <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
            Si tu n'as pas demandé cette réinitialisation, ignore cet email.<br/>
            Le lien expirera automatiquement dans 1 heure.
          </p>
          <hr style="border-color: #1e293b; margin: 24px 0;" />
          <p style="color: #475569; font-size: 11px;">
            World Cup Hub 2026 — ${FRONTEND_URL}
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Resend error: ${err.message}`);
  }
}

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée." });

  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: "Email requis." });

  try {
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    // Réponse identique que l'email existe ou non (sécurité)
    if (!user) {
      return res.status(200).json({
        message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
      });
    }

    // Supprimer les anciens tokens pour cet utilisateur
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Générer un token sécurisé
    const token     = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await PasswordResetToken.create({ userId: user._id, token, expiresAt });

    // Envoyer l'email
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
    await sendResetEmail(user.email, resetUrl);

    return res.status(200).json({
      message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
    });

  } catch (err) {
    console.error("[forgot-password]", err);
    return res.status(500).json({ error: "Erreur serveur, réessaie plus tard." });
  }
}
