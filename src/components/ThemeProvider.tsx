"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "system" | "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  effectiveTheme: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "toolich:theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  // Load stored preference on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const timer = setTimeout(() => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setMode(stored);
      }
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const effectiveTheme = useMemo<"light" | "dark">(() => {
    if (mode === "system") {
      return getSystemTheme();
    }
    return mode;
  }, [mode]);

  // Apply theme class and CSS variables to <html> so the whole site updates
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    if (effectiveTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    root.dataset.theme = effectiveTheme;

    // Override background / foreground / scrollbar variables used in globals.css
    if (effectiveTheme === "dark") {
      root.style.setProperty("--background", "#0a0a0a");
      root.style.setProperty("--foreground", "#ededed");
      root.style.setProperty("--scrollbar-thumb", "#555");
      root.style.setProperty("--scrollbar-track", "transparent");
      root.style.setProperty("--scrollbar-thumb-hover", "#777");
      root.style.colorScheme = "dark";
    } else {
      root.style.setProperty("--background", "#ffffff");
      root.style.setProperty("--foreground", "#171717");
      root.style.setProperty("--scrollbar-thumb", "#c4c4c4");
      root.style.setProperty("--scrollbar-track", "transparent");
      root.style.setProperty("--scrollbar-thumb-hover", "#a0a0a0");
      root.style.colorScheme = "light";
    }
  }, [effectiveTheme]);

  // Persist user preference (but not the derived system value)
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, mounted]);

  const value = useMemo(
    () => ({
      mode,
      effectiveTheme,
      setMode,
    }),
    [mode, effectiveTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

