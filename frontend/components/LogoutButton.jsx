"use client";

import { clearTokens } from "../lib/auth";

export default function LogoutButton({ className = "ghost", onLoggedOut }) {
  const handleLogout = () => {
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    if (onLoggedOut) onLoggedOut();
  };

  return (
    <button type="button" className={className} onClick={handleLogout} aria-label="Log out of Phill">
      Log out
    </button>
  );
}
