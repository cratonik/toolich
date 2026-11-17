"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Install / open state for the Toolich PWA.
 *
 * - "install": the browser offered an install prompt (Chrome, Edge, Android).
 * - "open":    the app is installed; opening uses the web+toolich: protocol
 *              handler from manifest.json, which launches the installed app.
 * - "ios":     iOS/iPadOS Safari — install is manual (Share → Add to Home Screen).
 * - "safari-mac": macOS Safari — install is manual (File → Add to Dock).
 * - "hidden":  already running as the app, or the browser can't install PWAs.
 */
export type PwaState = "hidden" | "install" | "open" | "ios" | "safari-mac";

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type RelatedApp = { platform: string; url?: string };

const INSTALLED_KEY = "toolich-pwa-installed";
export const PWA_PROTOCOL = "web+toolich:";

// The install prompt fires once per page load, possibly before the button mounts,
// so capture it at module level and share it with every button instance.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function readFlag(): boolean {
    try {
        return localStorage.getItem(INSTALLED_KEY) === "1";
    } catch {
        return false;
    }
}
function writeFlag(installed: boolean) {
    try {
        if (installed) localStorage.setItem(INSTALLED_KEY, "1");
        else localStorage.removeItem(INSTALLED_KEY);
    } catch {
        // storage unavailable
    }
}

if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
        // The browser only offers the prompt when the app is NOT installed.
        writeFlag(false);
        notify();
    });
    window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        writeFlag(true);
        notify();
    });
}

function isStandalone(): boolean {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: window-controls-overlay)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

function detectManualPlatform(): PwaState | null {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) return "ios";
    const isMacSafari = /Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg|Firefox|OPR/.test(ua);
    if (isMacSafari) return "safari-mac";
    return null;
}

function computeState(): PwaState {
    if (isStandalone()) return "hidden";
    if (deferredPrompt) return "install";
    if (readFlag()) return "open";
    return detectManualPlatform() ?? "hidden";
}

export function usePwaInstall() {
    const [state, setState] = useState<PwaState>("hidden");

    useEffect(() => {
        const update = () => setState(computeState());
        listeners.add(update);
        update();

        // Remember installs: a visit inside the app, or the browser reporting it.
        if (isStandalone()) writeFlag(true);
        const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<RelatedApp[]> };
        nav.getInstalledRelatedApps?.()
            .then((apps) => {
                if (apps.some((a) => a.platform === "webapp")) {
                    writeFlag(true);
                    update();
                }
            })
            .catch(() => {});

        return () => {
            listeners.delete(update);
        };
    }, []);

    const install = useCallback(async () => {
        const prompt = deferredPrompt;
        if (!prompt) return;
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        deferredPrompt = null;
        if (outcome === "accepted") writeFlag(true);
        notify();
    }, []);

    const open = useCallback(() => {
        // Handled by the installed app via manifest "protocol_handlers"; the app
        // receives /?pwa-open=web+toolich:<path> and navigates to <path>.
        window.location.href = `${PWA_PROTOCOL}${window.location.pathname}${window.location.search}`;
    }, []);

    return { state, install, open };
}
