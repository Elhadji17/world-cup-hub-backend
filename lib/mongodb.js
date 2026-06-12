// lib/mongodb.js
// Connexion MongoDB Atlas avec cache — pattern recommandé pour Vercel Functions
// Chaque Function est stateless mais partage la connexion en mémoire chaude

import mongoose from "mongoose";

// URI définie dans les variables d'environnement Vercel
// Format : mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Variable d'environnement MONGODB_URI manquante.");
}

// Cache global pour réutiliser la connexion entre les invocations Vercel
let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  // Connexion déjà établie
  if (cached.conn) return cached.conn;

  // Connexion en cours
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize:    5,        // Limité pour le free tier Atlas
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
