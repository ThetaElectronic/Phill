import { ACCESS_COOKIE, REFRESH_COOKIE } from "./constants";
import { apiUrl } from "./api";

const STORAGE_KEY = "phill_tokens";

function decodeBase64Json(segment) {
  try {
    const payload = typeof atob === "function" ? atob(segment) : Buffer.from(segment, "base64").toString("utf-8");
    return JSON.parse(payload);
  } catch (error) {
    console.warn("Unable to decode token payload", error);
    return null;
  }
}

export function decodeAccessPayload(accessToken) {
  if (!accessToken) return null;
  const parts = accessToken.split(".");
  if (parts.length !== 3) return null;
  return decodeBase64Json(parts[1]);
}

export function decodeAccessExp(accessToken) {
  const payload = decodeAccessPayload(accessToken);
  if (!payload?.exp) return null;
  return new Date(payload.exp * 1000);
}

function maxAgeFromDate(date, fallbackSeconds) {
  if (!date) return fallbackSeconds;
  const delta = Math.floor((date.getTime() - Date.now()) / 1000);
  return Math.max(delta, fallbackSeconds);
}

function readCookieTokens() {
  if (typeof document === "undefined") return null;
  const entries = document.cookie.split(";").map((part) => part.trim().split("="));
  const map = Object.fromEntries(entries.filter(([key]) => key));
  const access_token = map[ACCESS_COOKIE];
  const refresh_token = map[REFRESH_COOKIE];
  if (!access_token) return null;
  return {
    access_token,
    refresh_token,
    token_type: "bearer",
  };
}

export function loadTokens() {
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }
  return readCookieTokens();
}

export function storeTokens(tokens) {
  if (!tokens?.access_token) return;
  const expiry = decodeAccessExp(tokens.access_token);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    const accessMaxAge = maxAgeFromDate(expiry, 60 * 60); // 1h default
    document.cookie = `${ACCESS_COOKIE}=${tokens.access_token}; Path=/; Max-Age=${accessMaxAge}; SameSite=Lax`;
    if (tokens.refresh_token) {
      document.cookie = `${REFRESH_COOKIE}=${tokens.refresh_token}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${ACCESS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${REFRESH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function bearerHeaders(tokens) {
  if (!tokens?.access_token) return {};
  const type = tokens.token_type || "Bearer";
  return { Authorization: `${type} ${tokens.access_token}` };
}

export function preferenceKey(base, tokens) {
  const payload = decodeAccessPayload(tokens?.access_token);
  const user = payload?.sub || "anon";
  return `phill:${user}:${base}`;
}

export function shouldRefreshSoon(tokens, thresholdSeconds = 60) {
  const expiry = decodeAccessExp(tokens?.access_token);
  if (!expiry) return false;
  const delta = (expiry.getTime() - Date.now()) / 1000;
  return delta < thresholdSeconds;
}

export async function refreshTokens(refreshToken) {
  if (!refreshToken) throw new Error("Missing refresh token");
  const res = await fetch(apiUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    const message = payload?.detail || `Refresh failed (${res.status})`;
    throw new Error(message);
  }
  const data = await res.json();
  return data;
}

export async function ensureFreshTokens(tokens) {
  if (!tokens) return null;
  if (!shouldRefreshSoon(tokens)) return tokens;
  if (!tokens.refresh_token) return tokens;
  const refreshed = await refreshTokens(tokens.refresh_token);
  const next = { ...tokens, ...refreshed };
  storeTokens(next);
  return next;
}

export async function refreshAndStore(tokens) {
  if (!tokens?.refresh_token) throw new Error("No refresh token available");
  const refreshed = await refreshTokens(tokens.refresh_token);
  const next = { ...tokens, ...refreshed };
  storeTokens(next);
  return next;
}
