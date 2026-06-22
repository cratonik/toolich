"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (t: Theme) => void;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "toolich-theme";

function getSystemPreference(): ResolvedTheme {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function applyClass(resolved: ResolvedTheme) {
    const root = document.documentElement;
    if (resolved === "dark") {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeRaw] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
    const [mounted, setMounted] = useState(false);

    // On first mount, read localStorage and apply
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        const chosen: Theme = stored === "light" || stored === "dark" ? stored : "system";
        const resolved: ResolvedTheme = chosen === "system" ? getSystemPreference() : chosen;

        const timer = setTimeout(() => {
            setThemeRaw(chosen);
            setResolvedTheme(resolved);
            applyClass(resolved);
            setMounted(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    // Listen for OS theme changes when mode = "system"
    useEffect(() => {
        if (!mounted || theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => {
            const next = getSystemPreference();
            setResolvedTheme(next);
            applyClass(next);
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [mounted, theme]);

    const setTheme = useCallback((t: Theme) => {
        const resolved: ResolvedTheme = t === "system" ? getSystemPreference() : t;
        setThemeRaw(t);
        setResolvedTheme(resolved);
        applyClass(resolved);
        localStorage.setItem(STORAGE_KEY, t);
    }, []);

    const toggleTheme = useCallback(() => {
        const next: ResolvedTheme = resolvedTheme === "dark" ? "light" : "dark";
        setTheme(next);
    }, [resolvedTheme, setTheme]);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
    return ctx;
}
