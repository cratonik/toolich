"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Share, X } from "lucide-react";
import { usePwaInstall } from "@/lib/use-pwa-install";
import { Tooltip } from "@/components/Tooltip";

const BUTTON_CLASS =
    "flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 transition-all hover:scale-105 active:scale-95";

/**
 * Dock button: installs the Toolich PWA, or opens it if it is already installed.
 * On Safari (no install API) it shows the manual steps instead.
 */
export function InstallAppButton() {
    const { state, install, open } = usePwaInstall();
    const [showHelp, setShowHelp] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showHelp) return;
        const onDown = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) setShowHelp(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [showHelp]);

    if (state === "hidden") return null;

    if (state === "open") {
        return (
            <Tooltip label="Open in Toolich app">
                <button type="button" onClick={open} className={BUTTON_CLASS} aria-label="Open in Toolich app">
                    <ExternalLink className="h-[18px] w-[18px]" />
                </button>
            </Tooltip>
        );
    }

    if (state === "install") {
        return (
            <Tooltip label="Install Toolich app">
                <button type="button" onClick={install} className={BUTTON_CLASS} aria-label="Install Toolich app">
                    <Download className="h-[18px] w-[18px]" />
                </button>
            </Tooltip>
        );
    }

    // Safari: no programmatic install, so explain the manual steps.
    return (
        <div ref={wrapperRef} className="relative flex">
            <Tooltip label="Install Toolich app" disabled={showHelp}>
                <button
                    type="button"
                    onClick={() => setShowHelp((v) => !v)}
                    className={BUTTON_CLASS}
                    aria-label="Install Toolich app"
                    aria-expanded={showHelp}
                >
                    <Download className="h-[18px] w-[18px]" />
                </button>
            </Tooltip>
            {showHelp && (
                <div
                    role="dialog"
                    aria-label="How to install Toolich"
                    className="absolute bottom-full right-0 mb-3 w-64 rounded-xl border border-zinc-200 bg-white p-3 text-xs leading-relaxed text-zinc-600 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                >
                    <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-50">Install Toolich</span>
                        <button type="button" onClick={() => setShowHelp(false)} aria-label="Close" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    {state === "ios" ? (
                        <p>
                            Tap the <Share className="inline h-3.5 w-3.5 align-text-bottom" /> <strong>Share</strong> button, then choose{" "}
                            <strong>Add to Home Screen</strong>.
                        </p>
                    ) : (
                        <p>
                            In the menu bar choose <strong>File → Add to Dock</strong>.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
