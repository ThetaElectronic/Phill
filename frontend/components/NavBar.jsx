"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SessionIndicator from "./SessionIndicator";

export default function NavBar({ navLinks, userLabel }) {
  const pathname = usePathname();

  return (
    <header className="glass">
      <div className="shell brand-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="brand-mark" style={{ gap: "0.35rem" }}>
          <div className="orb" aria-hidden />
          <div className="stack" style={{ gap: "0.1rem" }}>
            <div className="pill">Phill</div>
            <span className="muted tiny">Calm, focused workspace</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <nav className="nav chip-row" aria-label="Primary navigation">
            {navLinks.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  className={`chip${active ? " chip-active" : ""}`}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="stack" style={{ gap: "0.1rem", alignItems: "flex-end" }}>
            {userLabel && <span className="tiny muted">Signed in as</span>}
            <SessionIndicator label={userLabel} compact />
          </div>
        </div>
      </div>
    </header>
  );
}
