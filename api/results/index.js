// api/results/index.js
// GET /api/results
// Retourne tous les matchs déjà traités (scores réels)
// Public — pas besoin de token

import { connectDB }     from "../../lib/mongodb.js";
import { ProcessedMatch } from "../../lib/models.js";
import { handleCors }    from "../../lib/auth.js";

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée." });

  try {
    await connectDB();

    const results = await ProcessedMatch.find({}).lean();

    // Transformer en objet indexé par matchId pour accès rapide côté frontend
    const resultsMap = {};
    for (const r of results) {
      resultsMap[r.matchId] = {
        realScoreA: r.realScoreA,
        realScoreB: r.realScoreB,
      };
    }

    // Cache 60 secondes
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ results: resultsMap });

  } catch (err) {
    console.error("[results]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
