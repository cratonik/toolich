"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { CATEGORY_LABELS } from "@/lib/routes";

export default function ToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // pathname is like "/tools/developers/base64-encode"
    // segments = ["", "tools", "developers", "base64-encode"]
    const segments = pathname.split("/");
    const category = segments[2]; // e.g. "developers"
    const isToolPage = segments.length > 3; // deeper than /tools/<category>

    // If on a tool page, go back to category; if on category page, go home
    const backHref = isToolPage ? `/tools/${category}` : ROUTES.home;
    const backLabel = isToolPage
        ? `Back to ${CATEGORY_LABELS[category] ?? "category"}`
        : "Back to all tools";

    return (
        <div className="min-h-screen bg-zinc-50 px-4 pt-24 pb-10 dark:bg-zinc-950 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        {backLabel}
                    </Link>
                </div>
                {children}
            </div>
        </div>
    );
}
