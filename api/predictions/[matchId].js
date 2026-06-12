// api/predictions/[matchId].js
// GET /api/predictions/:matchId
// Header : Authorization: Bearer <token>
// Retourne : { prediction } ou { prediction: null } si pas encore pronostiqué

import { connectDB }              from "../../lib/mongodb.js";
import { Prediction }             from "../../lib/models.js";
import { verifyToken, handleCors } from "../../lib/auth.js";

export default async function handler(req, res) {
  handleCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const decoded = verifyToken(req);
  if (!decoded) {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }

  const { matchId } = req.query;

  if (!matchId || isNaN(+matchId)) {
    return res.status(400).json({ error: "matchId invalide." });
  }

  try {
    await connectDB();

    const prediction = await Prediction.findOne({
      userId:  decoded.id,
      matchId: +matchId,
    }).lean();

    return res.status(200).json({ prediction: prediction ?? null });

  } catch (err) {
    console.error("[predictions/matchId]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
