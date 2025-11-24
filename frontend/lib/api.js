import { ensureFreshTokens, loadTokens, refreshAndStore, bearerHeaders } from "./auth";

export function getApiBase() {
  // Prefer the public API base. Fall back to the backend URL (injected at build time)
  // so docker builds that only set NEXT_BACKEND_URL still work, then default to /api
  // for same-origin proxying via Nginx.
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_BACKEND_URL || "/api";
}

export function apiUrl(path = "") {
  const base = getApiBase().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export async function fetchWithAuth(path, init = {}) {
  let tokens = loadTokens();
  if (!tokens) throw new Error("Missing tokens");
  tokens = await ensureFreshTokens(tokens);

  const perform = async (authTokens, retry = true) => {
    const res = await fetch(apiUrl(path), {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...bearerHeaders(authTokens),
      },
    });

    if (res.status === 401 && retry && authTokens.refresh_token) {
      const refreshed = await refreshAndStore(authTokens);
      return perform(refreshed, false);
    }

    return res;
  };

  return perform(tokens);
}
