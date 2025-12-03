"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "phill_theme";

function applyTheme(next) {
  if (typeof document === "undefined") return;
  const isDark = next === "dark";
  document.body.classList.toggle("theme-dark", isDark);
  document.documentElement.classList.toggle("theme-dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

export default function ThemeToggle({ className = "ghost" }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const prefersDark =
      typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored === "dark" || (!stored && prefersDark) ? "dark" : "light";
    setTheme(initial);
    applyTheme(initial);

    if (!stored && typeof window !== "undefined" && window.matchMedia) {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handle = (event) => {
        const next = event.matches ? "dark" : "light";
        setTheme(next);
        applyTheme(next);
      };
      media.addEventListener("change", handle);
      return () => media.removeEventListener("change", handle);
    }
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  return (
    <button type="button" className={className} onClick={toggle} aria-pressed={theme === "dark"}>
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
