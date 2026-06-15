// api/quiz/index.js
// Route unique pour tout le système Quiz
// GET  /api/quiz?action=stats        → coins + vies du joueur
// POST /api/quiz?action=submit       → soumettre résultat d'une partie
// POST /api/quiz?action=shop         → acheter un article
// GET  /api/quiz?action=leaderboard  → classement mondial

import { connectDB }              from "../../lib/mongodb.js";
import { GameStats }              from "../../lib/models.js";
import { verifyToken, handleCors } from "../../lib/auth.js";

const LIFE_REGEN_MS = 60 * 60 * 1000;
const MAX_LIVES     = 5;

const SHOP_ITEMS = {
  "life_1":    { cost: 50,  lives: 1, duration: null, hints: 0 },
  "life_3":    { cost: 120, lives: 3, duration: null, hints: 0 },
  "double_1h": { cost: 200, lives: 0, duration: 60,   hints: 0 },
  "hints_3":   { cost: 80,  lives: 0, duration: null, hints: 3 },
};

function regenLives(lives, lastLifeAt) {
  if (lives >= MAX_LIVES) return { lives: MAX_LIVES, lastLifeAt };
  const elapsed  = Date.now() - new Date(lastLifeAt).getTime();
  const regenned = Math.floor(elapsed / LIFE_REGEN_MS);
  if (regenned <= 0) return { lives, lastLifeAt };
  const newLives    = Math.min(lives + regenned, MAX_LIVES);
  const newLastLife = new Date(new Date(lastLifeAt).getTime() + regenned * LIFE_REGEN_MS);
  return { lives: newLives, lastLifeAt: newLastLife };
}

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = req.query.action;
  await connectDB();

  // ── GET stats ─────────────────────────────────────────────────────────────
  if (req.method === "GET" && action === "stats") {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ error: "Token invalide." });

    let stats = await GameStats.findOne({ userId: decoded.id });
    if (!stats) {
      stats = await GameStats.create({ userId: decoded.id, username: decoded.username });
    }

    const { lives, lastLifeAt } = regenLives(stats.lives, stats.lastLifeAt);
    if (lives !== stats.lives) {
      stats = await GameStats.findOneAndUpdate(
        { userId: decoded.id },
        { lives, lastLifeAt },
        { new: true }
      );
    }

    const nextLifeIn    = lives >= MAX_LIVES ? null
      : LIFE_REGEN_MS - (Date.now() - new Date(stats.lastLifeAt).getTime());
    const isDoubleCoins = stats.doubleCoinsUntil && new Date(stats.doubleCoinsUntil) > new Date();

    return res.status(200).json({
      coins: stats.coins, lives: stats.lives, totalCoins: stats.totalCoins,
      quizPlayed: stats.quizPlayed, quizCorrect: stats.quizCorrect,
      bestStreak: stats.bestStreak, nextLifeIn,
      freeHintsLeft: stats.freeHintsLeft, isDoubleCoins,
    });
  }

  // ── POST submit ───────────────────────────────────────────────────────────
  if (req.method === "POST" && action === "submit") {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ error: "Token invalide." });

    const { correct, wrong, streak, fastAnswers = 0, livesUsed = 0 } = req.body ?? {};
    if (correct == null) return res.status(400).json({ error: "correct requis." });

    let stats = await GameStats.findOne({ userId: decoded.id });
    if (!stats) stats = await GameStats.create({ userId: decoded.id, username: decoded.username });

    const { lives: currentLives, lastLifeAt } = regenLives(stats.lives, stats.lastLifeAt);
    const isDoubleCoins = stats.doubleCoinsUntil && new Date(stats.doubleCoinsUntil) > new Date();
    const multiplier    = isDoubleCoins ? 2 : 1;

    let coinsEarned = correct * 10 * multiplier;
    if (fastAnswers > 0) coinsEarned += fastAnswers * 10 * multiplier;
    if (streak >= 10)    coinsEarned += 80 * multiplier;
    else if (streak >= 5) coinsEarned += 30 * multiplier;

    const newLives      = Math.max(0, currentLives - livesUsed);
    const newLastLifeAt = newLives < currentLives ? new Date() : lastLifeAt;

    const updated = await GameStats.findOneAndUpdate(
      { userId: decoded.id },
      {
        $inc: { coins: coinsEarned, totalCoins: coinsEarned, quizPlayed: 1, quizCorrect: correct },
        $set: { lives: newLives, lastLifeAt: newLastLifeAt, bestStreak: Math.max(stats.bestStreak, streak ?? 0) },
      },
      { new: true }
    );

    return res.status(200).json({ coinsEarned, coins: updated.coins, lives: updated.lives, isDoubleCoins });
  }

  // ── POST shop ─────────────────────────────────────────────────────────────
  if (req.method === "POST" && action === "shop") {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ error: "Token invalide." });

    const { item } = req.body ?? {};
    const shopItem  = SHOP_ITEMS[item];
    if (!shopItem) return res.status(400).json({ error: "Article introuvable." });

    const stats = await GameStats.findOne({ userId: decoded.id });
    if (!stats)             return res.status(404).json({ error: "Joueur introuvable." });
    if (stats.coins < shopItem.cost) {
      return res.status(400).json({ error: `Pas assez de coins. (${stats.coins}/${shopItem.cost})` });
    }

    const update = { $inc: { coins: -shopItem.cost }, $set: {} };
    if (shopItem.lives > 0) update.$set.lives = stats.lives + shopItem.lives;
    if (shopItem.duration > 0) update.$set.doubleCoinsUntil = new Date(Date.now() + shopItem.duration * 60 * 1000);
    if (shopItem.hints > 0)    update.$inc.freeHintsLeft = shopItem.hints;

    const updated = await GameStats.findOneAndUpdate({ userId: decoded.id }, update, { new: true });
    return res.status(200).json({ message: "Achat effectué !", coins: updated.coins, lives: updated.lives, item });
  }

  // ── GET leaderboard ───────────────────────────────────────────────────────
  if (req.method === "GET" && action === "leaderboard") {
    const limit = Math.min(parseInt(req.query.limit ?? "50"), 100);
    const leaderboard = await GameStats.find({})
      .sort({ totalCoins: -1, quizCorrect: -1 })
      .limit(limit)
      .select("username totalCoins coins quizPlayed quizCorrect bestStreak")
      .lean();

    const ranked = leaderboard.map((e, i) => ({
      rank: i + 1, username: e.username, totalCoins: e.totalCoins,
      coins: e.coins, quizPlayed: e.quizPlayed, quizCorrect: e.quizCorrect,
      bestStreak: e.bestStreak,
      accuracy: e.quizPlayed > 0 ? Math.round((e.quizCorrect / (e.quizPlayed * 10)) * 100) : 0,
    }));

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json({ leaderboard: ranked });
  }

  return res.status(400).json({ error: "Action invalide. Utilise ?action=stats|submit|shop|leaderboard" });
}
