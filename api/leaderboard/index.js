// api/leaderboard/index.js
// GET /api/leaderboard?limit=20
// Public — pas besoin de token
// GET /api/leaderboard          → classement pronostics
// GET /api/leaderboard?type=results → scores réels des matchs
// Retourne : { leaderboard: [{ rank, username, totalPoints, exactScores, correctResults }] }

import { connectDB } from "../../lib/mongodb.js";
import { Prediction } from "../../lib/models.js";
import { handleCors } from "../../lib/auth.js";

export default async function handler(req, res) {
  handleCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const limit = Math.min(parseInt(req.query.limit ?? "20", 10), 50);

  try {
    await connectDB();

    // Agrégation MongoDB : grouper par joueur, sommer les points
    const leaderboard = await Prediction.aggregate([
      // Seulement les pronostics avec points calculés
      { $match: { points: { $ne: null } } },

      // Grouper par joueur
      {
        $group: {
          _id:            "$username",
          totalPoints:    { $sum: "$points" },
          // Score exact = 15 pts (ou 30 avec joker)
          exactScores:    { $sum: { $cond: [{ $gte: ["$points", 15] }, 1, 0] } },
          // Bon résultat = 7 pts minimum
          correctResults: { $sum: { $cond: [{ $gte: ["$points", 7]  }, 1, 0] } },
          predictions:    { $sum: 1 },
        },
      },

      // Trier par points décroissants, puis scores exacts
      { $sort: { totalPoints: -1, exactScores: -1, correctResults: -1 } },

      // Limiter
      { $limit: limit },

      // Reformater
      {
        $project: {
          _id:            0,
          username:       "$_id",
          totalPoints:    1,
          exactScores:    1,
          correctResults: 1,
          predictions:    1,
        },
      },
    ]);

    // Ajouter le rang
    const ranked = leaderboard.map((entry, i) => ({
      rank: i + 1,
      ...entry,
    }));

    // Cache 30 secondes côté Vercel CDN
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

    return res.status(200).json({ leaderboard: ranked });

  } catch (err) {
    console.error("[leaderboard]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
