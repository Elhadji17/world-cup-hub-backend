// api/admin/recalculate.js
// POST /api/admin/recalculate
// Remet totalPoints à 0 et recalcule depuis les predictions existantes

import { connectDB }          from "../../lib/mongodb.js";
import { handleCors }         from "../../lib/auth.js";
import { recalculateAllPoints } from "../../lib/processResults.js";

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée." });

  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Accès interdit." });
  }

  try {
    await connectDB();
    const result = await recalculateAllPoints();
    return res.status(200).json({
      message: "Recalcul terminé avec succès.",
      ...result,
    });
  } catch (err) {
    console.error("[admin/recalculate]", err);
    return res.status(500).json({ error: err.message });
  }
}
