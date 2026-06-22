import React from "react";

/**
 * Parses Slack's link syntax (e.g. <https://example.com|Example> or <https://example.com>)
 * and returns React nodes with <a> links styled properly.
 */
export function renderSlackText(text: string): React.ReactNode {
    if (!text) return "";

    const regex = /<([^>|]+)(?:\|([^>]+))?>/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const index = match.index;
        const rawUrl = match[1];
        const label = match[2] || rawUrl;

        // Push preceding plain text
        if (index > lastIndex) {
            parts.push(text.substring(lastIndex, index));
        }

        // Push formatted anchor element
        parts.push(
            <a
                key={index}
                href={rawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition-colors break-all inline-block"
            >
                {label}
            </a>
        );

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : text;
}
