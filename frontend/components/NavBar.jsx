"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LogoutButton from "./LogoutButton";
import SessionIndicator from "./SessionIndicator";
import ThemeToggle from "./ThemeToggle";

export default function NavBar({ navLinks, userLabel }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="glass">
      <div className="shell brand-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="brand-mark" style={{ gap: "0.35rem" }}>
          <Image src="/phill-logo.svg" width={42} height={42} alt="Phill logo" className="brand-logo" />
          <div className="stack" style={{ gap: "0.1rem" }}>
            <strong>Phill</strong>
            <span className="muted tiny">Focused AI workspace</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <nav className="nav chip-row" aria-label="Primary navigation">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
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
          <div className="chip-row" style={{ alignItems: "center", gap: "0.25rem" }}>
            <ThemeToggle className="ghost" />
            <LogoutButton className="ghost" onLoggedOut={() => router.push("/login")} />
            <SessionIndicator label={userLabel} compact />
          </div>
        </div>
      </div>
    </header>
  );
}
