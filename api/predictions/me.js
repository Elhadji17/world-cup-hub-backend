// api/predictions/me.js
// GET /api/predictions/me
// Retourne tous les pronostics du joueur connecté (avec points)

import { connectDB }              from "../../lib/mongodb.js";
import { Prediction }             from "../../lib/models.js";
import { verifyToken, handleCors } from "../../lib/auth.js";

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée." });

  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: "Token invalide." });

  try {
    await connectDB();

    const predictions = await Prediction.find({ userId: decoded.id })
      .select("matchId scoreA scoreB isJoker points breakdown")
      .lean();

    return res.status(200).json({ predictions });

  } catch (err) {
    console.error("[predictions/me]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
