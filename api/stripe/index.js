// api/stripe/index.js
// POST /api/stripe?action=checkout → créer session paiement
// POST /api/stripe?action=webhook  → recevoir événements Stripe

import Stripe                      from "stripe";
import { connectDB }               from "../../lib/mongodb.js";
import { GameStats }               from "../../lib/models.js";
import { verifyToken, handleCors } from "../../lib/auth.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const COIN_PACKS = {
  "coins_500":  { coins: 500,  price: 99,  label: "500 coins",  bonus: ""     },
  "coins_1200": { coins: 1200, price: 199, label: "1200 coins", bonus: "+20%" },
  "coins_3000": { coins: 3000, price: 499, label: "3000 coins", bonus: "+50%" },
  "coins_7000": { coins: 7000, price: 999, label: "7000 coins", bonus: "+75%" },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; });
    req.on("end",  () => resolve(data));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  handleCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = req.query.action;

  // ── POST checkout ─────────────────────────────────────────────────────────
  if (req.method === "POST" && action === "checkout") {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ error: "Token invalide." });

    const { packId } = req.body ?? {};
    const pack = COIN_PACKS[packId];
    if (!pack) return res.status(400).json({ error: "Pack introuvable." });

    const frontendUrl = process.env.FRONTEND_URL ?? "https://worldcuphub2026.vercel.app";

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [{
          price_data: {
            currency:     "eur",
            unit_amount:  pack.price,
            product_data: {
              name:        `⚽ World Cup Hub — ${pack.label}`,
              description: pack.bonus ? `${pack.label} ${pack.bonus} offerts !` : pack.label,
            },
          },
          quantity: 1,
        }],
        metadata: {
          userId:   decoded.id,
          username: decoded.username,
          packId,
          coins:    pack.coins.toString(),
        },
        success_url: `${frontendUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${frontendUrl}/shop/coins`,
      });

      return res.status(200).json({ url: session.url, sessionId: session.id });
    } catch (err) {
      console.error("[stripe/checkout]", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST webhook ──────────────────────────────────────────────────────────
  if (req.method === "POST" && action === "webhook") {
    const sig    = req.headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      const rawBody = await getRawBody(req);
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } catch (err) {
      console.error("[webhook] Signature invalide:", err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    if (event.type === "checkout.session.completed") {
      const session           = event.data.object;
      const { userId, coins } = session.metadata ?? {};

      if (!userId || !coins) return res.status(400).json({ error: "Metadata manquante." });

      try {
        await connectDB();
        const coinsToAdd = parseInt(coins);
        await GameStats.findOneAndUpdate(
          { userId },
          { $inc: { coins: coinsToAdd, totalCoins: coinsToAdd } },
          { upsert: true }
        );
        console.log(`[webhook] +${coinsToAdd} coins pour ${userId}`);
      } catch (err) {
        console.error("[webhook] Erreur MongoDB:", err);
        return res.status(500).json({ error: "Erreur serveur." });
      }
    }

    return res.status(200).json({ received: true });
  }

  return res.status(400).json({ error: "Action invalide." });
}
