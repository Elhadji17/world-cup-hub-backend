// api/quiz/shop.js
// POST /api/quiz/shop
// Body : { item } — acheter un article du shop

import { connectDB }              from "../../lib/mongodb.js";
import { GameStats }              from "../../lib/models.js";
import { verifyToken, handleCors } from "../../lib/auth.js";

const SHOP_ITEMS = {
  "life_1":       { cost: 50,  lives: 1,  duration: null, hints: 0 },
  "life_3":       { cost: 120, lives: 3,  duration: null, hints: 0 },
  "double_1h":    { cost: 200, lives: 0,  duration: 60,   hints: 0 }, // 60 minutes
  "hints_3":      { cost: 80,  lives: 0,  duration: null, hints: 3 },
};

const MAX_LIVES = 5;

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée." });

  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: "Token invalide." });

  const { item } = req.body ?? {};
  const shopItem = SHOP_ITEMS[item];

  if (!shopItem) return res.status(400).json({ error: "Article introuvable." });

  await connectDB();

  const stats = await GameStats.findOne({ userId: decoded.id });
  if (!stats) return res.status(404).json({ error: "Joueur introuvable." });

  // Vérifier les coins
  if (stats.coins < shopItem.cost) {
    return res.status(400).json({
      error: `Pas assez de coins. Tu as ${stats.coins} coins, il en faut ${shopItem.cost}.`,
    });
  }

  // Construire la mise à jour
  const update = {
    $inc: { coins: -shopItem.cost },
    $set: {},
  };

  if (shopItem.lives > 0) {
    update.$set.lives = Math.min(stats.lives + shopItem.lives, MAX_LIVES);
  }

  if (shopItem.duration > 0) {
    update.$set.doubleCoinsUntil = new Date(Date.now() + shopItem.duration * 60 * 1000);
  }

  if (shopItem.hints > 0) {
    update.$inc.freeHintsLeft = shopItem.hints;
  }

  const updated = await GameStats.findOneAndUpdate(
    { userId: decoded.id },
    update,
    { new: true }
  );

  return res.status(200).json({
    message:  "Achat effectué !",
    coins:    updated.coins,
    lives:    updated.lives,
    item,
  });
}
