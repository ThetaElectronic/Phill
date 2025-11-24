export function getApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || "/api";
}

export function apiUrl(path = "") {
  const base = getApiBase().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
