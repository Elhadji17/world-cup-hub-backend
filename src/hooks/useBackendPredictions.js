// src/hooks/useBackendPredictions.js
// Remplace usePredictions.js quand le backend est prêt
// Sauvegarde sur MongoDB via /api/predictions/save
// Fallback localStorage si l'utilisateur n'est pas connecté

import { useState, useCallback } from "react";

const API        = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY  = "wch_token";
const STORAGE_KEY = "wch_predictions";

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

export function useBackendPredictions() {
  const [predictions, setPredictions] = useState(loadLocal);
  const [syncing,     setSyncing]     = useState(false);

  const token = localStorage.getItem(TOKEN_KEY);

  // ── Sauvegarder un pronostic ─────────────────────────────────────────────
  const savePrediction = useCallback(async (matchId, scores, isJoker = false) => {
    // Toujours sauvegarder en local d'abord (UX instantanée)
    const updated = { ...predictions, [matchId]: { ...scores, isJoker } };
    setPredictions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Si connecté, synchroniser avec le backend
    if (!token) return { success: true, offline: true };

    setSyncing(true);
    try {
      const res = await fetch(`${API}/api/predictions/save`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ matchId, ...scores, isJoker }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return { success: true, prediction: data.prediction };
    } catch (err) {
      console.warn("[savePrediction] backend error:", err.message);
      return { success: true, offline: true }; // gardé en local
    } finally {
      setSyncing(false);
    }
  }, [predictions, token]);

  // ── Récupérer un pronostic ───────────────────────────────────────────────
  const getPrediction = useCallback((matchId) => {
    return predictions[matchId] ?? null;
  }, [predictions]);

  const predictedCount = Object.keys(predictions).length;

  return { savePrediction, getPrediction, predictions, predictedCount, syncing };
}
