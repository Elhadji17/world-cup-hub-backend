// api/leaderboard/index.js
// GET /api/leaderboard              → classement pronostics
// GET /api/leaderboard?type=results → scores réels des matchs

import { connectDB }     from "../../lib/mongodb.js";
import { Prediction, ProcessedMatch } from "../../lib/models.js";
import { handleCors }    from "../../lib/auth.js";

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée." });

  await connectDB();

  // ── GET scores réels des matchs (remplace api/results) ───────────────────
  if (req.query.type === "results") {
    const results = await ProcessedMatch.find({}).lean();
    const resultsMap = {};
    for (const r of results) {
      resultsMap[r.matchId] = { realScoreA: r.realScoreA, realScoreB: r.realScoreB };
    }
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ results: resultsMap });
  }

  // ── GET classement pronostics (défaut) ────────────────────────────────────
  const limit = Math.min(parseInt(req.query.limit ?? "20", 10), 50);

  const leaderboard = await Prediction.aggregate([
    { $match: { points: { $ne: null } } },
    {
      $group: {
        _id:            "$username",
        totalPoints:    { $sum: "$points" },
        exactScores:    { $sum: { $cond: [{ $gte: ["$points", 15] }, 1, 0] } },
        correctResults: { $sum: { $cond: [{ $gte: ["$points", 7]  }, 1, 0] } },
        predictions:    { $sum: 1 },
      },
    },
    { $sort: { totalPoints: -1, exactScores: -1, correctResults: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0, username: "$_id",
        totalPoints: 1, exactScores: 1, correctResults: 1, predictions: 1,
      },
    },
  ]);

  const ranked = leaderboard.map((entry, i) => ({ rank: i + 1, ...entry }));
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
  return res.status(200).json({ leaderboard: ranked });
}
