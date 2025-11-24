import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "./lib/constants";

const PUBLIC_PATHS = [
  "/login",
  "/api",
  "/healthz",
  "/favicon.ico",
  "/robots.txt",
];

export function middleware(request) {
  const { pathname, search } = request.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public");

  if (isPublic) return NextResponse.next();

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!access) {
    const loginUrl = new URL("/login", request.url);
    const nextParam = `${pathname}${search || ""}`;
    loginUrl.searchParams.set("next", nextParam);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
