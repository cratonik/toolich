"use client";

import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { CATEGORY_LABELS } from "@/lib/routes";
import { useTabContext } from "@/lib/tab-context";

type Breadcrumb = {
    label: string;
    href?: string;
};

type ToolPageHeaderProps = {
    toolName: string;
    description: string;
    category: string;
    slug?: string;
};

export function ToolPageHeader({
    toolName,
    description,
    category,
    slug,
}: ToolPageHeaderProps) {
    const { isFavorite, toggleFavorite } = useTabContext();
    
    // Automatically derive the slug from the URL if not provided directly (e.g. on direct page access)
    let activeSlug = slug;
    if (!activeSlug && typeof window !== "undefined") {
        const segments = window.location.pathname.split("/").filter(Boolean);
        if (segments.length >= 3 && segments[0] === "tools") {
            activeSlug = segments[2];
        }
    }

    const isFav = activeSlug ? isFavorite(activeSlug) : false;

    const breadcrumbs: Breadcrumb[] = [
        { label: "Home", href: ROUTES.home },
        { label: CATEGORY_LABELS[category] ?? category },
        { label: toolName },
    ];

    return (
        <div className="mb-8 space-y-3">
            {/* Breadcrumb */}
            <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400"
            >
                {breadcrumbs.map((crumb, i) => (
                    <span key={crumb.label} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight className="h-3 w-3" />}
                        {crumb.href ? (
                            <Link
                                href={crumb.href}
                                className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
                            >
                                {crumb.label}
                            </Link>
                        ) : (
                            <span
                                className={
                                    i === breadcrumbs.length - 1
                                        ? "text-zinc-900 dark:text-zinc-100"
                                        : ""
                                }
                            >
                                {crumb.label}
                            </span>
                        )}
                    </span>
                ))}
            </nav>

            {/* Title + description */}
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                    {toolName}
                </h1>
                {activeSlug && (
                    <button
                        type="button"
                        onClick={() => toggleFavorite(activeSlug)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:border-zinc-300 hover:scale-105 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                        title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                        <Star
                            className={`h-4 w-4 transition-colors ${
                                isFav
                                    ? "fill-amber-400 text-amber-500"
                                    : "text-zinc-400 dark:text-zinc-500 hover:text-amber-500"
                            }`}
                        />
                    </button>
                )}
            </div>
            <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
                {description}
            </p>
        </div>
    );
}
