"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export function AdSense() {
    const pathname = usePathname();

    // Do not show ads on offline or API routes
    const isExcluded = pathname === "/offline" || pathname.startsWith("/api");

    if (isExcluded) {
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
