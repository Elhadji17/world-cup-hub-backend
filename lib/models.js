// lib/models.js
// Modèles Mongoose — User et Prediction
// Un seul fichier pour éviter les re-définitions dans Vercel Functions

import mongoose from "mongoose";

// ── User ──────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    username: {
      type:      String,
      required:  true,
      unique:    true,
      trim:      true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
      lowercase: true,
    },
    password: {
      type:     String,
      required: true,
      // Hashé avec bcryptjs avant sauvegarde
    },
    // Médaille calculée côté client, stockée ici pour le leaderboard
    totalPoints: { type: Number, default: 0 },
    // Nombre de jokers restants (1 par défaut, extensible)
    jokersLeft:  { type: Number, default: 1  },
  },
  { timestamps: true }
);

// ── Prediction ────────────────────────────────────────────────────────────────
const predictionSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true }, // dénormalisé pour le leaderboard
    matchId:  { type: Number, required: true  },
    scoreA:   { type: Number, required: true, min: 0 },
    scoreB:   { type: Number, required: true, min: 0 },
    isJoker:  { type: Boolean, default: false },
    // Remplis après le match
    points:   { type: Number, default: null  },
    breakdown:{ type: String, default: null  },
  },
  { timestamps: true }
);

// Index pour récupérer rapidement les pronostics d'un joueur
predictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });
// Index pour le leaderboard
predictionSchema.index({ username: 1 });

// Évite les ré-enregistrements dans Vercel (hot reload)
export const User = mongoose.models.User
  ?? mongoose.model("User", userSchema);

export const Prediction = mongoose.models.Prediction
  ?? mongoose.model("Prediction", predictionSchema);

// ── ProcessedMatch ────────────────────────────────────────────────────────────
// Garde trace des matchs déjà traités pour éviter les doublons de points
const processedMatchSchema = new mongoose.Schema(
  {
    matchId:    { type: Number, required: true, unique: true },
    realScoreA: { type: Number, required: true },
    realScoreB: { type: Number, required: true },
  },
  { timestamps: true }
);

export const ProcessedMatch = mongoose.models.ProcessedMatch
  ?? mongoose.model("ProcessedMatch", processedMatchSchema);
