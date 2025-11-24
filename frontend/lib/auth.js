const STORAGE_KEY = "phill_tokens";

export function loadTokens() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function storeTokens(tokens) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function bearerHeaders(tokens) {
  if (!tokens?.access_token) return {};
  const type = tokens.token_type || "Bearer";
  return { Authorization: `${type} ${tokens.access_token}` };
}
