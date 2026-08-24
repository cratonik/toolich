"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Star, Plus, EyeOff, Eye } from "lucide-react";
import { ROUTES, categoryPath } from "@/lib/routes";
import { CATEGORY_LABELS } from "@/lib/routes";
import { useTabContext } from "@/lib/tab-context";
import { getToolBySlug } from "@/lib/tool-registry";

type Breadcrumb = {
    label: string;
    href?: string;
};

type ToolPageHeaderProps = {
    toolName: string;
    description: string;
    category: string;
    slug?: string;
    hideOpenAgain?: boolean;
};

export function ToolPageHeader({
    toolName,
    description,
    category,
    slug,
    hideOpenAgain,
}: ToolPageHeaderProps) {
    const { isFavorite, toggleFavorite, openTab, openCategoryInCurrentTab, goHome, viewMode, toggleViewMode } = useTabContext();
    const [isMac, setIsMac] = useState(false);
    useEffect(() => {
        setIsMac(navigator.userAgent.toLowerCase().includes("mac"));
    }, []);
    
    // Automatically derive the slug from the URL if not provided directly (e.g. on direct page access)
    let activeSlug = slug;
    if (!activeSlug && typeof window !== "undefined") {
        const segments = window.location.pathname.split("/").filter(Boolean);
        if (segments.length >= 3 && segments[0] === "tools") {
            activeSlug = segments[2];
        }
    }

    const isFav = activeSlug ? isFavorite(activeSlug) : false;
    const meta = activeSlug ? getToolBySlug(category, activeSlug) : null;
    const originalName = meta ? meta.name : toolName.split(" #")[0];

    const breadcrumbs: Breadcrumb[] = [
        { label: "Home", href: ROUTES.home },
        { label: CATEGORY_LABELS[category] ?? category, href: categoryPath(category) },
        { label: toolName },
    ];

    const renderBreadcrumbs = () => (
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
                            onClick={(e) => {
                                if (crumb.href === ROUTES.home) {
                                    e.preventDefault();
                                    goHome();
                                } else if (crumb.href === categoryPath(category)) {
                                    e.preventDefault();
                                    openCategoryInCurrentTab(category, crumb.label);
                                }
                            }}
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
    );

    const renderButtons = () => {
        if (!activeSlug) return null;
        return (
            <div className="flex items-center gap-2">
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
                {!hideOpenAgain && (
                    <div className="relative group">
                        <button
                            type="button"
                            onClick={() => openTab({ name: originalName, slug: activeSlug!, category })}
                            className="flex h-8 px-2.5 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-600 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:text-zinc-900 hover:scale-105 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
                            aria-label="Open tool again in a new tab"
                        >
                            <Plus className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                            <span>Open Again</span>
                        </button>
                        {/* Instant CSS Tooltip */}
                        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 scale-90 opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100 pointer-events-none">
                            <div className="rounded bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-800 dark:border-zinc-700 whitespace-nowrap">
                                New Tab ({isMac ? "⌥A" : "Alt+A"})
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (viewMode === "minified") {
        return (
            <div className="mb-2 flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-4 overflow-hidden">
                    <h1 className="text-md font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                        {toolName}
                    </h1>
                    <div className="flex-shrink-0 scale-90 origin-left">
                        {renderButtons()}
                    </div>
                </div>
                <div className="hidden sm:block flex-shrink-0 opacity-80">
                    {renderBreadcrumbs()}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8 space-y-3">
            {renderBreadcrumbs()}
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                    {toolName}
                </h1>
                {renderButtons()}
            </div>
            <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
                {description}
            </p>
        </div>
    );
}
