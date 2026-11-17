"use client";

import { useState } from "react";
import { Check, Link2, Linkedin, Twitter } from "lucide-react";

const BTN =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-indigo-500/50 dark:hover:text-indigo-400";

export function ShareButtons({ url, title }: { url: string; title: string }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard blocked; nothing to do
        }
    };

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    return (
        <div className="flex items-center gap-2">
            <button type="button" onClick={copy} className={BTN} aria-label={copied ? "Link copied" : "Copy link"}>
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
            </button>
            <a
                href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                target="_blank"
                rel="noopener noreferrer"
                className={BTN}
                aria-label="Share on X"
            >
                <Twitter className="h-4 w-4" />
            </a>
            <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className={BTN}
                aria-label="Share on LinkedIn"
            >
                <Linkedin className="h-4 w-4" />
            </a>
            {copied && <span className="text-xs text-emerald-600 dark:text-emerald-400">Link copied</span>}
        </div>
    );
}
