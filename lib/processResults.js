// lib/processResults.js
// Fix : recalcul propre sans doublons — totalPoints recalculé depuis zéro

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
    points += 15; breakdown.push("Score exact +15");
  } else {
    if (predOut === actualOut) {
      points += 7; breakdown.push("Bon résultat +7");
      if (pred.scoreA - pred.scoreB === actual.scoreA - actual.scoreB) {
        points += 3; breakdown.push("Bon écart +3");
      }
      if (pred.scoreA === actual.scoreA) { points += 1; breakdown.push("Buts A +1"); }
      if (pred.scoreB === actual.scoreB) { points += 1; breakdown.push("Buts B +1"); }
    } else {
      if (Math.abs(pred.scoreA - actual.scoreA) <= 1 &&
          Math.abs(pred.scoreB - actual.scoreB) <= 1) {
        points += 2; breakdown.push("Score proche +2");
      }
    }
  }

  if (isJoker && points > 0) { points *= 2; breakdown.push("Joker ×2"); }
  return { points, breakdown: breakdown.join(" · ") || "Aucun point" };
}

export async function processMatchResult(matchId, realScoreA, realScoreB) {
  // Si déjà traité → skip complètement (plus de recalcul)
  const alreadyDone = await ProcessedMatch.findOne({ matchId });
  if (alreadyDone) return { updated: 0, skipped: true };

  const predictions = await Prediction.find({ matchId: +matchId });

  // Marquer comme traité en premier pour éviter les doublons si cron parallèle
  await ProcessedMatch.create({ matchId, realScoreA, realScoreB });

  if (predictions.length === 0) return { updated: 0, skipped: false };

  const actual = { scoreA: +realScoreA, scoreB: +realScoreB };

  for (const pred of predictions) {
    // Ne traiter que si points pas encore calculés
    if (pred.points !== null && pred.points !== undefined) continue;

    const { points, breakdown } = calculatePoints(
      { scoreA: pred.scoreA, scoreB: pred.scoreB },
      actual,
      pred.isJoker
    );

    // Mettre à jour la prediction
    await Prediction.findByIdAndUpdate(pred._id, { points, breakdown });

    // Incrémenter totalPoints SEULEMENT si points > 0
    if (points > 0) {
      await User.findByIdAndUpdate(pred.userId, { $inc: { totalPoints: points } });
    }
  }

  return { updated: predictions.length, skipped: false };
}

/**
 * Recalcule TOUS les totalPoints depuis zéro — à appeler une seule fois pour corriger
 */
export async function recalculateAllPoints() {
  // Remettre tous les totalPoints à 0
  await User.updateMany({}, { $set: { totalPoints: 0 } });

  // Récupérer toutes les predictions avec points calculés
  const predictions = await Prediction.find({ points: { $ne: null } });

  for (const pred of predictions) {
    if (pred.points > 0) {
      await User.findByIdAndUpdate(pred.userId, { $inc: { totalPoints: pred.points } });
    }
  }

  return { recalculated: predictions.length };
}
