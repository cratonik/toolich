"use client";

import { useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { getToolBySlug } from "@/lib/tool-registry";

/**
 * Pages where Google Auto Ads may run: Home and real tool pages (each tool page
 * has a written guide below the tool). Everything else stays ad-free:
 *
 * - 404 / unknown tools, /offline, /contact, /about, /privacy, /terms
 *   ("screens without publisher content" under AdSense policy)
 * - category lists (/tools, /tools/<category>): mostly navigation
 * - /blogs: posts are currently short; re-enable once they are long-form
 *
 * The script can't be unloaded once it runs, so links from ad pages to these
 * pages use plain <a> (full page load) instead of next/link; see Footer.
 */
export function adsAllowed(pathname: string): boolean {
    if (pathname === "/") return true;
    const match = pathname.match(/^\/tools\/([^/]+)\/([^/]+)\/?$/);
    return match !== null && getToolBySlug(match[1], match[2]) !== undefined;
}

export function AdSense() {
    const pathname = usePathname();
    // Decide once, from the URL this page was loaded with. The tab system can
    // change the address later (pushState); that must not switch ads on, e.g.
    // on a 404 page. Client-side navigation can't unload the script anyway.
    const [allowed] = useState(() => adsAllowed(pathname));

    if (!allowed) {
        return null;
    }

    return (
        <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5052542306758700"
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    );
}
