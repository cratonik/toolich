"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { TabIdContext } from "./tab-context";

/**
 * A drop-in replacement for useState that persists the value to sessionStorage,
 * scoped automatically by tab ID to support independent inputs for duplicate tabs.
 * On mount, it restores the saved value if present.
 * 
 * @param key - Unique sessionStorage key
 * @param initialValue - Default value if nothing is stored
 */
export function useSessionState<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const tabId = useContext(TabIdContext);
    const finalKey = tabId ? `${key}-${tabId}` : key;

    const [state, setState] = useState<T>(initialValue);
    const [mounted, setMounted] = useState(false);

    // Initial load from sessionStorage
    useEffect(() => {
        setMounted(true);
        try {
            const stored = sessionStorage.getItem(finalKey);
            if (stored !== null) {
                setState(JSON.parse(stored) as T);
            }
        } catch {
            // ignore
        }
    }, [finalKey]);

    // Persist to sessionStorage on every change
    useEffect(() => {
        if (!mounted) return;
        try {
            sessionStorage.setItem(finalKey, JSON.stringify(state));
        } catch { /* quota exceeded — ignore */ }
    }, [finalKey, state, mounted]);

    // Wrapped setter that supports function updater pattern
    const setSessionState = useCallback(
        (value: T | ((prev: T) => T)) => {
            setState(value);
        },
        [],
    );

    return [state, setSessionState];
}
