// api/auth/register.js
// POST /api/auth/register
// Body : { username, email, password }
// Retourne : { token, user: { id, username } }

import bcrypt        from "bcryptjs";
import { connectDB } from "../../lib/mongodb.js";
import { User }      from "../../lib/models.js";
import { signToken, handleCors } from "../../lib/auth.js";

export default async function handler(req, res) {
  handleCors(res);

  // Preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const { username, email, password } = req.body ?? {};

  // ── Validation basique ────────────────────────────────────────────────────
  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email et password sont requis." });
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: "username : 3 à 20 caractères." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Mot de passe : minimum 6 caractères." });
  }

  try {
    await connectDB();

    // ── Vérifier unicité ────────────────────────────────────────────────────
    const existing = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase() }],
    });
    if (existing) {
      return res.status(409).json({
        error: existing.username === username
          ? "Ce pseudo est déjà pris."
          : "Cet email est déjà utilisé.",
      });
    }

    // ── Hasher le mot de passe ──────────────────────────────────────────────
    const hashed = await bcrypt.hash(password, 12);

    // ── Créer l'utilisateur ─────────────────────────────────────────────────
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashed,
    });

    const token = signToken({ id: user._id.toString(), username: user.username });

    return res.status(201).json({
      token,
      user: { id: user._id.toString(), username: user.username },
    });

  } catch (err) {
    console.error("[register]", err);
    return res.status(500).json({ error: "Erreur serveur, réessaie plus tard." });
  }
}
