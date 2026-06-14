// api/auth/reset-password.js
// POST /api/auth/reset-password
// Body : { token, newPassword }
// Vérifie le token et met à jour le mot de passe

import bcrypt           from "bcryptjs";
import { connectDB }    from "../../lib/mongodb.js";
import { User, PasswordResetToken } from "../../lib/models.js";
import { signToken, handleCors }    from "../../lib/auth.js";

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée." });

  const { token, newPassword } = req.body ?? {};

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token et nouveau mot de passe requis." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Mot de passe : minimum 6 caractères." });
  }

  try {
    await connectDB();

    // Vérifier le token
    const resetToken = await PasswordResetToken.findOne({
      token,
      used:      false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
      return res.status(400).json({
        error: "Lien invalide ou expiré. Demande un nouveau lien.",
      });
    }

    // Récupérer l'utilisateur
    const user = await User.findById(resetToken.userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    // Hasher le nouveau mot de passe
    const hashed = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe
    await User.findByIdAndUpdate(user._id, { password: hashed });

    // Marquer le token comme utilisé
    await PasswordResetToken.findByIdAndUpdate(resetToken._id, { used: true });

    // Connecter automatiquement — retourner un JWT
    const jwtToken = signToken({ id: user._id.toString(), username: user.username });

    return res.status(200).json({
      message: "Mot de passe réinitialisé avec succès !",
      token:   jwtToken,
      user:    { id: user._id.toString(), username: user.username },
    });

  } catch (err) {
    console.error("[reset-password]", err);
    return res.status(500).json({ error: "Erreur serveur, réessaie plus tard." });
  }
}
