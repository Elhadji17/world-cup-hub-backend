// api/admin/results.js
// POST /api/admin/results
// Header : x-admin-secret: <ADMIN_SECRET>
// Body   : { matchId, realScoreA, realScoreB }
// Action : calcule les points de tous les pronostics pour ce match
//          et met à jour MongoDB + totalPoints des users

import { connectDB }  from "../../lib/mongodb.js";
import { Prediction, User } from "../../lib/models.js";
import { handleCors } from "../../lib/auth.js";

// Système de scoring — copie de scoring.js côté backend
function getOutcome(a, b) {
  if (a > b) return "A";
  if (b > a) return "B";
  return "Draw";
}

function calculatePoints(pred, actual, isJoker = false) {
  const predOut   = getOutcome(pred.scoreA, pred.scoreB);
  const actualOut = getOutcome(actual.scoreA, actual.scoreB);

  let points = 0;
  const breakdown = [];

  if (pred.scoreA === actual.scoreA && pred.scoreB === actual.scoreB) {
    points += 15;
    breakdown.push("Score exact +15");
  } else {
    if (predOut === actualOut) {
      points += 7;
      breakdown.push("Bon résultat +7");

      const predDiff   = pred.scoreA - pred.scoreB;
      const actualDiff = actual.scoreA - actual.scoreB;
      if (predDiff === actualDiff) {
        points += 3;
        breakdown.push("Bon écart +3");
      }
      if (pred.scoreA === actual.scoreA) { points += 1; breakdown.push("Buts A exacts +1"); }
      if (pred.scoreB === actual.scoreB) { points += 1; breakdown.push("Buts B exacts +1"); }
    } else {
      const diffA = Math.abs(pred.scoreA - actual.scoreA);
      const diffB = Math.abs(pred.scoreB - actual.scoreB);
      if (diffA <= 1 && diffB <= 1) {
        points += 2;
        breakdown.push("Score proche +2");
      }
    }
  }

  if (isJoker && points > 0) {
    points *= 2;
    breakdown.push("Joker ×2");
  }

  return { points, breakdown: breakdown.join(" · ") || "Aucun point" };
}

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  // ── Vérification secret admin ────────────────────────────────────────────
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Accès interdit." });
  }

  const { matchId, realScoreA, realScoreB } = req.body ?? {};

  if (matchId == null || realScoreA == null || realScoreB == null) {
    return res.status(400).json({ error: "matchId, realScoreA et realScoreB sont requis." });
  }

  try {
    await connectDB();

    // ── Récupérer tous les pronostics pour ce match ──────────────────────
    const predictions = await Prediction.find({ matchId: +matchId });

    if (predictions.length === 0) {
      return res.status(200).json({
        message: `Aucun pronostic trouvé pour le match #${matchId}.`,
        updated: 0,
      });
    }

    const actual = { scoreA: +realScoreA, scoreB: +realScoreB };
    let updated = 0;

    // ── Calculer et sauvegarder les points pour chaque pronostic ─────────
    for (const pred of predictions) {
      const { points, breakdown } = calculatePoints(
        { scoreA: pred.scoreA, scoreB: pred.scoreB },
        actual,
        pred.isJoker
      );

      await Prediction.findByIdAndUpdate(pred._id, { points, breakdown });

      // Mettre à jour le totalPoints du joueur
      await User.findByIdAndUpdate(pred.userId, {
        $inc: { totalPoints: points },
      });

      updated++;
    }

    return res.status(200).json({
      message:    `Match #${matchId} traité avec succès.`,
      updated,
      result:     `${realScoreA} – ${realScoreB}`,
    });

  } catch (err) {
    console.error("[admin/results]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
