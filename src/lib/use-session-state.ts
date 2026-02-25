"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * A drop-in replacement for useState that persists the value to sessionStorage.
 * On mount, it restores the saved value if present.
 * 
 * @param key - Unique sessionStorage key (prefix with tool name for safety)
 * @param initialValue - Default value if nothing is stored
 */
export function useSessionState<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [state, setState] = useState<T>(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const stored = sessionStorage.getItem(key);
            return stored !== null ? (JSON.parse(stored) as T) : initialValue;
        } catch {
            return initialValue;
        }
    });

    // Persist to sessionStorage on every change
    useEffect(() => {
        try {
            sessionStorage.setItem(key, JSON.stringify(state));
        } catch { /* quota exceeded — ignore */ }
    }, [key, state]);

    // Wrapped setter that supports function updater pattern
    const setSessionState = useCallback(
        (value: T | ((prev: T) => T)) => {
            setState(value);
        },
        [],
    );

    return [state, setSessionState];
}
