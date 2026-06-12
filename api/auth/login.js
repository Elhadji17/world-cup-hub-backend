// api/auth/login.js
// POST /api/auth/login
// Body : { username, password }
// Retourne : { token, user: { id, username, totalPoints } }

import bcrypt        from "bcryptjs";
import { connectDB } from "../../lib/mongodb.js";
import { User }      from "../../lib/models.js";
import { signToken, handleCors } from "../../lib/auth.js";

export default async function handler(req, res) {
  handleCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: "username et password sont requis." });
  }

  try {
    await connectDB();

    // Chercher par username (insensible à la casse)
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });

    if (!user) {
      // Message volontairement vague pour la sécurité
      return res.status(401).json({ error: "Identifiants incorrects." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }

    const token = signToken({ id: user._id.toString(), username: user.username });

    return res.status(200).json({
      token,
      user: {
        id:          user._id.toString(),
        username:    user.username,
        totalPoints: user.totalPoints,
        jokersLeft:  user.jokersLeft,
      },
    });

  } catch (err) {
    console.error("[login]", err);
    return res.status(500).json({ error: "Erreur serveur, réessaie plus tard." });
  }
}
