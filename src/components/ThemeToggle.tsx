"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export function ThemeToggle() {
    const { resolvedTheme, toggleTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all hover:border-zinc-300 hover:text-zinc-900 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
        >
            {isDark ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
        </button>
    );
}
