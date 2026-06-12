// src/hooks/useAuth.js
// Gestion authentification — register, login, logout
// Stocke le token JWT dans localStorage

import { useState, useCallback } from "react";

const API = import.meta.env.VITE_API_URL ?? "";
// VITE_API_URL = URL de ton backend Vercel, ex: https://world-cup-hub-api.vercel.app
// En dev local tu peux laisser vide si le backend tourne sur le même domaine

const TOKEN_KEY = "wch_token";
const USER_KEY  = "wch_user";

function loadUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); }
  catch { return null; }
}

export function useAuth() {
  const [user,    setUser]    = useState(loadUser);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const token = localStorage.getItem(TOKEN_KEY);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'inscription.");

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY,  JSON.stringify(data.user));
      // Compat avec l'existant (Home.jsx lit playerName)
      localStorage.setItem("playerName", data.user.username);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Identifiants incorrects.");

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY,  JSON.stringify(data.user));
      localStorage.setItem("playerName", data.user.username);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("playerName");
    setUser(null);
  }, []);

  return { user, token, loading, error, register, login, logout };
}
