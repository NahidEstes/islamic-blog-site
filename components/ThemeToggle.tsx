"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const themeEvent = "noor-theme-change";
type Theme = "dark" | "light";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(onChange: () => void) {
  window.addEventListener(themeEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(themeEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "dark");
  const isDark = theme === "dark";

  function toggleTheme() {
    const next: Theme = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem("noor-theme", next);
    } catch {}
    window.dispatchEvent(new Event(themeEvent));
  }

  return (
    <button
      type="button"
      className="icon-link theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
