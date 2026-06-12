// lib/auth.js
// Helpers JWT pour l'authentification
// JWT_SECRET défini dans les variables d'environnement Vercel

import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("Variable d'environnement JWT_SECRET manquante.");
}

/**
 * Génère un token JWT pour un utilisateur
 * @param {{ id: string, username: string }} user
 * @returns {string} token valable 7 jours
 */
export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Vérifie et décode un token JWT depuis le header Authorization
 * @param {Request} req
 * @returns {{ id: string, username: string } | null}
 */
export function verifyToken(req) {
  const header = req.headers["authorization"] ?? "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return null;

  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

/**
 * Gère les requêtes OPTIONS (preflight CORS)
 * À appeler en début de chaque handler
 */
export function handleCors(res) {
  res.setHeader("Access-Control-Allow-Origin",  process.env.FRONTEND_URL ?? "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}
