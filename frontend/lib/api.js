export function getApiBase() {
  // Prefer the public API base. Fall back to the backend URL (injected at build time)
  // so docker builds that only set NEXT_BACKEND_URL still work, then default to /api
  // for same-origin proxying via Nginx.
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_BACKEND_URL ||
    "/api"
  );
}

export function apiUrl(path = "") {
  const base = getApiBase().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
