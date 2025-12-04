"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "./LogoutButton";
import SessionIndicator from "./SessionIndicator";
import ThemeToggle from "./ThemeToggle";

export default function NavBar({ navLinks, userLabel, isAdmin = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header className="glass">
      <div className="shell brand-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/dashboard" className="brand-mark" style={{ gap: "0.35rem" }}>
          <Image src="/phill-logo.svg" width={42} height={42} alt="Phill logo" className="brand-logo" />
          <div className="stack" style={{ gap: "0.1rem" }}>
            <strong>Phill</strong>
            <span className="muted tiny">Focused AI workspace</span>
          </div>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        {open && <button type="button" className="nav-overlay" aria-label="Close navigation" onClick={() => setOpen(false)} />}

        <div className={`nav-wrap${open ? " open" : ""}`}>
          <div className="nav-group" aria-label="Navigation">
            <span className="nav-label">Menu</span>
            <nav className="nav chip-row" aria-label="Primary navigation">
              {navLinks.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    className={`chip chip-nav${active ? " chip-active" : ""}`}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="chip-dot" aria-hidden />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="nav-group nav-actions" aria-label="Session controls">
            <span className="nav-label">Workspace</span>
            <div className="chip-row" style={{ alignItems: "center", gap: "0.25rem" }}>
              {isAdmin && (
                <Link className="chip chip-cta" href="/admin">
                  <span className="chip-dot" aria-hidden />
                  Admin panel
                </Link>
              )}
              <ThemeToggle className="ghost" />
              <LogoutButton className="ghost" onLoggedOut={() => router.push("/login")} />
              <SessionIndicator label={userLabel} compact />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
