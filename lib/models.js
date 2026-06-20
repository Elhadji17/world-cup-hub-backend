// lib/models.js
import mongoose from "mongoose";

// ── User ──────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    username:    { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20 },
    email:       { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:    { type: String, required: true },
    totalPoints: { type: Number, default: 0 },
    jokersLeft:  { type: Number, default: 1  },
  },
  { timestamps: true }
);

export const User = mongoose.models.User ?? mongoose.model("User", userSchema);

// ── Prediction ────────────────────────────────────────────────────────────
const predictionSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username:  { type: String, required: true },
    matchId:   { type: Number, required: true },
    scoreA:    { type: Number, required: true, min: 0 },
    scoreB:    { type: Number, required: true, min: 0 },
    isJoker:   { type: Boolean, default: false },
    points:    { type: Number, default: null },
    breakdown: { type: String, default: null },
  },
  { timestamps: true }
);

predictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });
predictionSchema.index({ username: 1 });

export const Prediction = mongoose.models.Prediction ?? mongoose.model("Prediction", predictionSchema);

// ── ProcessedMatch ────────────────────────────────────────────────────────
const processedMatchSchema = new mongoose.Schema(
  {
    matchId:    { type: Number, required: true, unique: true },
    realScoreA: { type: Number, required: true },
    realScoreB: { type: Number, required: true },
  },
  { timestamps: true }
);

export const ProcessedMatch = mongoose.models.ProcessedMatch ?? mongoose.model("ProcessedMatch", processedMatchSchema);

// ── PasswordResetToken ────────────────────────────────────────────────────
const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token:     { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetToken = mongoose.models.PasswordResetToken ?? mongoose.model("PasswordResetToken", passwordResetTokenSchema);

// ── GameStats ─────────────────────────────────────────────────────────────
const gameStatsSchema = new mongoose.Schema(
  {
    userId:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    username:         { type: String, required: true },
    coins:            { type: Number, default: 100 },
    lives:            { type: Number, default: 5, min: 0, max: 5 },
    lastLifeAt:       { type: Date, default: Date.now },
    totalCoins:       { type: Number, default: 100 },
    totalPoints:      { type: Number, default: 0 },
    quizPlayed:       { type: Number, default: 0 },
    quizCorrect:      { type: Number, default: 0 },
    bestStreak:       { type: Number, default: 0 },
    doubleCoinsUntil: { type: Date, default: null },
    freeHintsLeft:    { type: Number, default: 0 },
    cards:            { type: Array, default: [] },
    seenQuestions:    { type: Object, default: {} }, // { categoryId: [questionIds] }
  },
  { timestamps: true }
);

export const GameStats = mongoose.models.GameStats ?? mongoose.model("GameStats", gameStatsSchema);

// ── Challenge ─────────────────────────────────────────────────────────────
const challengeSchema = new mongoose.Schema(
  {
    challengeId:      { type: String, required: true, unique: true },
    challenger:       { type: String, required: true },
    challengerTeam:   { type: Array, required: true },
    challengerRating: { type: Number, default: 0 },
    opponent:         { type: String, default: null },
    result:           { type: Object, default: null },
    status:           { type: String, default: "pending" },
  },
  { timestamps: true }
);

export const Challenge = mongoose.models.Challenge ?? mongoose.model("Challenge", challengeSchema);
