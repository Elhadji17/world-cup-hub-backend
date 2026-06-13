// api/cron/update-results.js
// Cron job — tourne toutes les 5 minutes pendant la WC
// Récupère les matchs terminés sur football-data.org
// et calcule automatiquement les points

import { connectDB }                    from "../../lib/mongodb.js";
import { getFinishedMatches, mapTeamName } from "../../lib/football-api.js";
import { processMatchResult }            from "../../lib/processResults.js";
import { handleCors }                    from "../../lib/auth.js";
import { MATCHES }                       from "../../lib/matches-data.js";

export const config = {
  maxDuration: 30, // secondes — limite Vercel Functions gratuit
};

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  // Sécurité — vérifier le secret Vercel Cron ou admin
  const cronSecret  = req.headers["authorization"];
  const adminSecret = req.headers["x-admin-secret"];

  const validCron  = cronSecret === `Bearer ${process.env.CRON_SECRET}`;
  const validAdmin = adminSecret === process.env.ADMIN_SECRET;

  if (!validCron && !validAdmin) {
    return res.status(401).json({ error: "Non autorisé." });
  }

  try {
    await connectDB();

    // Récupérer les matchs terminés depuis football-data.org
    const apiMatches = await getFinishedMatches();

    if (apiMatches.length === 0) {
      return res.status(200).json({ message: "Aucun match terminé pour l'instant.", processed: 0 });
    }

    let totalUpdated  = 0;
    let totalSkipped  = 0;
    const results     = [];

    for (const apiMatch of apiMatches) {
      // Mapper les noms d'équipes anglais → français
      const teamA = mapTeamName(apiMatch.homeTeam?.name ?? "");
      const teamB = mapTeamName(apiMatch.awayTeam?.name ?? "");

      // Trouver le match correspondant dans notre base locale
      const localMatch = MATCHES.find(
        m => m.teamA === teamA && m.teamB === teamB
      );

      if (!localMatch) continue; // match non trouvé dans notre calendrier

      const realScoreA = apiMatch.score?.fullTime?.home ?? 0;
      const realScoreB = apiMatch.score?.fullTime?.away ?? 0;

      const { updated, skipped } = await processMatchResult(
        localMatch.id,
        realScoreA,
        realScoreB
      );

      if (skipped) {
        totalSkipped++;
      } else {
        totalUpdated += updated;
        results.push({
          matchId:  localMatch.id,
          teams:    `${teamA} ${realScoreA}–${realScoreB} ${teamB}`,
          updated,
        });
      }
    }

    return res.status(200).json({
      message:  `Cron exécuté avec succès.`,
      processed: results.length,
      skipped:   totalSkipped,
      totalPointsAwarded: totalUpdated,
      results,
    });

  } catch (err) {
    console.error("[cron/update-results]", err);
    return res.status(500).json({ error: err.message });
  }
}
