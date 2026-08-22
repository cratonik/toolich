"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * A drop-in replacement for useState that persists the value to localStorage.
 * Unlike useSessionState, this is NOT scoped by Tab ID, so it is shared across all tabs and persists between sessions.
 * On mount, it restores the saved value if present.
 * 
 * @param key - Unique localStorage key
 * @param initialValue - Default value if nothing is stored
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [state, setState] = useState<T>(initialValue);

    // Initial load from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(key);
            if (stored !== null) {
                setState(JSON.parse(stored) as T);
            }
        } catch {
            // ignore
        }
    }, [key]);

    // Listen for storage events across tabs, and custom events within the same tab
    useEffect(() => {
        const handleStorageChange = (e: Event) => {
            if (typeof StorageEvent !== "undefined" && e instanceof StorageEvent) {
                if (e.key === key && e.newValue !== null) {
                    setState(JSON.parse(e.newValue) as T);
                }
            } else if (e instanceof CustomEvent) {
                if (e.detail?.key === key) {
                    try {
                        const stored = localStorage.getItem(key);
                        if (stored !== null) {
                            setState(JSON.parse(stored) as T);
                        }
                    } catch {
                        // ignore
                    }
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("local-storage", handleStorageChange as EventListener);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("local-storage", handleStorageChange as EventListener);
        };
    }, [key]);

    // Wrapped setter that supports function updater pattern and dispatches event
    const setLocalState = useCallback(
        (value: T | ((prev: T) => T)) => {
            setState((prev) => {
                const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
                
                // Defer side-effects to avoid React warning: "Cannot update a component while rendering a different component"
                // The setState updater function must be pure.
                setTimeout(() => {
                    try {
                        localStorage.setItem(key, JSON.stringify(next));
                        window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
                    } catch {}
                }, 0);
                
                return next;
            });
        },
        [key],
    );

    return [state, setLocalState];
}
