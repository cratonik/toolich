"use client";

import { useEffect, useState } from "react";

// One request per page load, shared by every component that asks.
let statusPromise: Promise<boolean> | null = null;

function loadStatus(): Promise<boolean> {
    if (!statusPromise) {
        statusPromise = fetch("/api/blog-status")
            .then((res) => (res.ok ? res.json() : { available: false }))
            .then((data: { available?: boolean }) => data.available === true)
            .catch(() => false);
    }
    return statusPromise;
}

/**
 * Whether the blog is reachable. Starts as true so the link renders normally,
 * and flips to false if the blog API (cratonik.com) is down.
 */
export function useBlogAvailable(): boolean {
    const [available, setAvailable] = useState(true);
    useEffect(() => {
        let cancelled = false;
        loadStatus().then((ok) => {
            if (!cancelled) setAvailable(ok);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    return available;
}
