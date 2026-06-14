// lib/processResults.js
// Fix : on retire le filtre points:null pour recalculer si nécessaire

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

export async function processMatchResult(matchId, realScoreA, realScoreB) {
  // Vérifier si déjà traité
  const alreadyDone = await ProcessedMatch.findOne({ matchId });
  if (alreadyDone) {
    // Même si déjà dans processedmatches, vérifier si des predictions ont points:null
    const pendingPreds = await Prediction.find({ matchId: +matchId, points: null });
    if (pendingPreds.length === 0) return { updated: 0, skipped: true };

    // Recalculer pour les predictions manquées
    const actual = { scoreA: +realScoreA, scoreB: +realScoreB };
    let updated = 0;
    for (const pred of pendingPreds) {
      const { points, breakdown } = calculatePoints(
        { scoreA: pred.scoreA, scoreB: pred.scoreB },
        actual,
        pred.isJoker
      );
      await Prediction.findByIdAndUpdate(pred._id, { points, breakdown });
      if (points > 0) {
        await User.findByIdAndUpdate(pred.userId, { $inc: { totalPoints: points } });
      }
      updated++;
    }
    return { updated, skipped: false };
  }

  // Récupérer TOUS les pronostics pour ce match (pas seulement points:null)
  const predictions = await Prediction.find({ matchId: +matchId });

  if (predictions.length === 0) {
    await ProcessedMatch.create({ matchId, realScoreA, realScoreB });
    return { updated: 0, skipped: false };
  }

  const actual = { scoreA: +realScoreA, scoreB: +realScoreB };
  let updated = 0;

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
    updated++;
  }

  await ProcessedMatch.create({ matchId, realScoreA, realScoreB });
  return { updated, skipped: false };
}
