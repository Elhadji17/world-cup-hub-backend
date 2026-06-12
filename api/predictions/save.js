// api/predictions/save.js
// POST /api/predictions/save
// Header : Authorization: Bearer <token>
// Body   : { matchId, scoreA, scoreB, isJoker }
// Retourne : { prediction }

import { connectDB }              from "../../lib/mongodb.js";
import { Prediction, User }       from "../../lib/models.js";
import { verifyToken, handleCors } from "../../lib/auth.js";

export default async function handler(req, res) {
  handleCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  // ── Authentification ────────────────────────────────────────────────────────
  const decoded = verifyToken(req);
  if (!decoded) {
    return res.status(401).json({ error: "Token invalide ou expiré. Reconnecte-toi." });
  }

  const { matchId, scoreA, scoreB, isJoker = false } = req.body ?? {};

  // ── Validation ──────────────────────────────────────────────────────────────
  if (matchId == null || scoreA == null || scoreB == null) {
    return res.status(400).json({ error: "matchId, scoreA et scoreB sont requis." });
  }
  if (!Number.isInteger(+scoreA) || !Number.isInteger(+scoreB)) {
    return res.status(400).json({ error: "scoreA et scoreB doivent être des entiers." });
  }
  if (+scoreA < 0 || +scoreB < 0) {
    return res.status(400).json({ error: "Les scores ne peuvent pas être négatifs." });
  }

  try {
    await connectDB();

    // ── Si joker : vérifier qu'il n'est pas déjà posé sur un autre match ────
    if (isJoker) {
      const existingJoker = await Prediction.findOne({
        userId:  decoded.id,
        isJoker: true,
        matchId: { $ne: +matchId }, // pas ce match
      });
      if (existingJoker) {
        return res.status(400).json({
          error: `Tu as déjà posé ton joker sur le match #${existingJoker.matchId}. Retire-le d'abord.`,
        });
      }
    }

    // ── Upsert : créer ou mettre à jour le pronostic ────────────────────────
    const prediction = await Prediction.findOneAndUpdate(
      { userId: decoded.id, matchId: +matchId },
      {
        userId:   decoded.id,
        username: decoded.username,
        matchId:  +matchId,
        scoreA:   +scoreA,
        scoreB:   +scoreB,
        isJoker:  !!isJoker,
        points:   null,       // réinitialisé si modifié avant le match
        breakdown: null,
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({ prediction });

  } catch (err) {
    console.error("[predictions/save]", err);
    return res.status(500).json({ error: "Erreur serveur, réessaie plus tard." });
  }
}
