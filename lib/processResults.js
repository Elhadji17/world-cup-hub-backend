// lib/processResults.js
// Logique commune : traiter un résultat de match et mettre à jour MongoDB

import { Prediction, User, ProcessedMatch } from "./models.js";

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
      if (predDiff === actualDiff) { points += 3; breakdown.push("Bon écart +3"); }
      if (pred.scoreA === actual.scoreA) { points += 1; breakdown.push("Buts A +1"); }
      if (pred.scoreB === actual.scoreB) { points += 1; breakdown.push("Buts B +1"); }
    } else {
      const diffA = Math.abs(pred.scoreA - actual.scoreA);
      const diffB = Math.abs(pred.scoreB - actual.scoreB);
      if (diffA <= 1 && diffB <= 1) { points += 2; breakdown.push("Score proche +2"); }
    }
  }

  if (isJoker && points > 0) { points *= 2; breakdown.push("Joker ×2"); }

  return { points, breakdown: breakdown.join(" · ") || "Aucun point" };
}

/**
 * Traite un match terminé et met à jour les points
 * @param {number} matchId      - ID du match dans notre système
 * @param {number} realScoreA   - buts équipe A
 * @param {number} realScoreB   - buts équipe B
 * @returns {{ updated: number, skipped: boolean }}
 */
export async function processMatchResult(matchId, realScoreA, realScoreB) {
  // Vérifier si ce match a déjà été traité
  const alreadyDone = await ProcessedMatch.findOne({ matchId });
  if (alreadyDone) return { updated: 0, skipped: true };

  const predictions = await Prediction.find({
    matchId: +matchId,
    points:  null, // seulement les non-calculés
  });

  if (predictions.length === 0) {
    // Marquer comme traité même sans pronostics
    await ProcessedMatch.create({ matchId, realScoreA, realScoreB });
    return { updated: 0, skipped: false };
  }

  const actual = { scoreA: +realScoreA, scoreB: +realScoreB };

  for (const pred of predictions) {
    const { points, breakdown } = calculatePoints(
      { scoreA: pred.scoreA, scoreB: pred.scoreB },
      actual,
      pred.isJoker
    );

    await Prediction.findByIdAndUpdate(pred._id, { points, breakdown });
    if (points > 0) {
      await User.findByIdAndUpdate(pred.userId, { $inc: { totalPoints: points } });
    }
  }

  // Marquer ce match comme traité pour éviter les doublons
  await ProcessedMatch.create({ matchId, realScoreA, realScoreB });

  return { updated: predictions.length, skipped: false };
}
