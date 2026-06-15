// api/quiz/leaderboard.js
// GET /api/quiz/leaderboard
// Classement par totalCoins

import { connectDB }  from "../../lib/mongodb.js";
import { GameStats }  from "../../lib/models.js";
import { handleCors } from "../../lib/auth.js";

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée." });

  await connectDB();

  const limit = Math.min(parseInt(req.query.limit ?? "50"), 100);

  const leaderboard = await GameStats.find({})
    .sort({ totalCoins: -1, quizCorrect: -1 })
    .limit(limit)
    .select("username totalCoins coins quizPlayed quizCorrect bestStreak")
    .lean();

  const ranked = leaderboard.map((e, i) => ({
    rank:        i + 1,
    username:    e.username,
    totalCoins:  e.totalCoins,
    coins:       e.coins,
    quizPlayed:  e.quizPlayed,
    quizCorrect: e.quizCorrect,
    bestStreak:  e.bestStreak,
    accuracy:    e.quizPlayed > 0
      ? Math.round((e.quizCorrect / (e.quizPlayed * 10)) * 100)
      : 0,
  }));

  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
  return res.status(200).json({ leaderboard: ranked });
}
