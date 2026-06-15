// api/quiz/stats.js
// GET  /api/quiz/stats     → récupérer coins + vies du joueur
// POST /api/quiz/stats     → mettre à jour après une partie

import { connectDB }              from "../../lib/mongodb.js";
import { GameStats }              from "../../lib/models.js";
import { verifyToken, handleCors } from "../../lib/auth.js";

const LIFE_REGEN_MS  = 60 * 60 * 1000; // 1 heure
const MAX_LIVES      = 5;
const COINS_PER_CORRECT  = 10;
const COINS_FAST_BONUS   = 10; // réponse en < 5s
const COINS_STREAK_5     = 30; // série de 5
const COINS_STREAK_10    = 80; // série de 10

/**
 * Calcule les vies actuelles en tenant compte de la régénération
 */
function regenLives(lives, lastLifeAt) {
  if (lives >= MAX_LIVES) return { lives: MAX_LIVES, lastLifeAt };

  const now      = Date.now();
  const elapsed  = now - new Date(lastLifeAt).getTime();
  const regenned = Math.floor(elapsed / LIFE_REGEN_MS);

  if (regenned <= 0) return { lives, lastLifeAt };

  const newLives    = Math.min(lives + regenned, MAX_LIVES);
  const newLastLife = new Date(new Date(lastLifeAt).getTime() + regenned * LIFE_REGEN_MS);

  return { lives: newLives, lastLifeAt: newLastLife };
}

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: "Token invalide." });

  await connectDB();

  // ── GET — récupérer les stats ─────────────────────────────────────────────
  if (req.method === "GET") {
    let stats = await GameStats.findOne({ userId: decoded.id });

    if (!stats) {
      // Créer les stats pour un nouveau joueur
      stats = await GameStats.create({
        userId:   decoded.id,
        username: decoded.username,
      });
    }

    // Régénérer les vies
    const { lives, lastLifeAt } = regenLives(stats.lives, stats.lastLifeAt);
    if (lives !== stats.lives) {
      stats = await GameStats.findOneAndUpdate(
        { userId: decoded.id },
        { lives, lastLifeAt },
        { new: true }
      );
    }

    // Temps avant prochaine vie
    const nextLifeIn = lives >= MAX_LIVES
      ? null
      : LIFE_REGEN_MS - (Date.now() - new Date(stats.lastLifeAt).getTime());

    const isDoubleCoins = stats.doubleCoinsUntil && new Date(stats.doubleCoinsUntil) > new Date();

    return res.status(200).json({
      coins:           stats.coins,
      lives:           stats.lives,
      totalCoins:      stats.totalCoins,
      quizPlayed:      stats.quizPlayed,
      quizCorrect:     stats.quizCorrect,
      bestStreak:      stats.bestStreak,
      nextLifeIn,
      freeHintsLeft:   stats.freeHintsLeft,
      isDoubleCoins,
    });
  }

  // ── POST — soumettre le résultat d'une partie ─────────────────────────────
  if (req.method === "POST") {
    const { correct, wrong, streak, fastAnswers = 0, livesUsed = 0 } = req.body ?? {};

    if (correct == null) return res.status(400).json({ error: "correct requis." });

    let stats = await GameStats.findOne({ userId: decoded.id });
    if (!stats) {
      stats = await GameStats.create({ userId: decoded.id, username: decoded.username });
    }

    // Régénérer les vies d'abord
    const { lives: currentLives, lastLifeAt } = regenLives(stats.lives, stats.lastLifeAt);

    // Calculer les coins gagnés
    const isDoubleCoins = stats.doubleCoinsUntil && new Date(stats.doubleCoinsUntil) > new Date();
    const multiplier    = isDoubleCoins ? 2 : 1;

    let coinsEarned = correct * COINS_PER_CORRECT * multiplier;
    if (fastAnswers > 0) coinsEarned += fastAnswers * COINS_FAST_BONUS * multiplier;
    if (streak >= 10)    coinsEarned += COINS_STREAK_10 * multiplier;
    else if (streak >= 5) coinsEarned += COINS_STREAK_5 * multiplier;

    // Nouvelles vies après la partie
    const newLives = Math.max(0, currentLives - (livesUsed ?? 0));
    const newLastLifeAt = newLives < currentLives ? new Date() : lastLifeAt;

    // Mettre à jour
    const updated = await GameStats.findOneAndUpdate(
      { userId: decoded.id },
      {
        $inc: {
          coins:       coinsEarned,
          totalCoins:  coinsEarned,
          quizPlayed:  1,
          quizCorrect: correct,
        },
        $set: {
          lives:      newLives,
          lastLifeAt: newLastLifeAt,
          bestStreak: Math.max(stats.bestStreak, streak ?? 0),
        },
      },
      { new: true }
    );

    return res.status(200).json({
      coinsEarned,
      coins:    updated.coins,
      lives:    updated.lives,
      isDoubleCoins,
    });
  }

  return res.status(405).json({ error: "Méthode non autorisée." });
}
