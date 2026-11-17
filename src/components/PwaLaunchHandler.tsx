"use client";

import { useEffect } from "react";
import { PWA_PROTOCOL } from "@/lib/use-pwa-install";

/**
 * The "Open in app" button navigates to web+toolich:<path>. The installed app
 * receives that as /?pwa-open=web+toolich:<path> (manifest "protocol_handlers")
 * and this component moves it to <path>, so the app opens on the same page.
 */
export function PwaLaunchHandler() {
    useEffect(() => {
        const raw = new URLSearchParams(window.location.search).get("pwa-open");
        if (raw === null) return;

        let target = "/";
        if (raw.toLowerCase().startsWith(PWA_PROTOCOL)) {
            const path = raw.slice(PWA_PROTOCOL.length);
            // Same-origin paths only: "/x" yes; "//evil.com" or "/\evil.com" no.
            if (path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\")) {
                target = path;
            }
        }
        window.location.replace(target);
    }, []);

    return null;
}
