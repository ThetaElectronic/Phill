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
    const initial = stored === "dark" ? "dark" : "light";
    setTheme(initial);
    applyTheme(initial);
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
