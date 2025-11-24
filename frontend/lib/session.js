import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiUrl } from "./api";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./constants";


function decodeExp(accessToken) {
  if (!accessToken) return null;
  const parts = accessToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    if (!payload?.exp) return null;
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}

export function readSessionFromCookies() {
  const cookieStore = cookies();
  const access_token = cookieStore.get(ACCESS_COOKIE)?.value;
  const refresh_token = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!access_token) return null;
  return {
    access_token,
    refresh_token,
    token_type: "bearer",
    expiry: decodeExp(access_token),
  };
}

export function getSessionFromHeaders() {
  const hdrs = headers();
  const auth = hdrs.get("authorization") || hdrs.get("Authorization");
  if (!auth) return null;
  const [, token] = auth.split(" ");
  if (!token) return null;
  return { access_token: token, token_type: "bearer", refresh_token: null, expiry: decodeExp(token) };
}

export function getServerSession() {
  return readSessionFromCookies() || getSessionFromHeaders();
}

export async function getSessionOrRedirect(pathname = "/") {
  const session = getServerSession();
  if (!session?.access_token) {
    const target = pathname.startsWith("http") ? pathname : `${pathname}`;
    redirect(`/login?next=${encodeURIComponent(target)}`);
  }
  return session;
}

export async function serverFetchWithAuth(path, session, init = {}) {
  const token = session?.access_token;
  if (!token) {
    throw new Error("Missing access token for server fetch");
  }
  const headersWithAuth = {
    ...(init.headers || {}),
    Authorization: `${session.token_type || "Bearer"} ${token}`,
  };
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: headersWithAuth,
    cache: "no-store",
  });
  return response;
}
