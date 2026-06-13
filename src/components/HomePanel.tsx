"use client";

import { useState, useEffect } from "react";
import { Code, Server, Shield, Network, BarChart3, LayoutGrid } from "lucide-react";
import { ToolCategoryCard } from "@/components/ToolCategoryCard";
import { getRecentTools } from "@/lib/recent-tools";
import { allTools } from "@/lib/tool-registry";
import { useTabContext } from "@/lib/tab-context";
import type { LucideIcon } from "lucide-react";

type ToolCategory = {
    title: string;
    description: string;
    tags: string[];
    icon: LucideIcon;
    iconClassName: string;
    cardClassName?: string;
    glowColor?: "indigo" | "emerald" | "rose" | "violet" | "amber" | "cyan" | "zinc";
    categorySlug: string;
};

const TOOL_CATEGORIES: ToolCategory[] = [
    {
        title: "Developers",
        description: "Code formatters, converters, validators, and generators.",
        tags: ["JSON", "Base64", "UUID", "Hash"],
        icon: Code,
        iconClassName:
            "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
        glowColor: "indigo",
        categorySlug: "developers",
    },
    {
        title: "DevOps",
        description: "Docker, Kubernetes, CI/CD, and infrastructure helpers.",
        tags: ["YAML", "Cron", "ENV", "Docker"],
        icon: Server,
        iconClassName:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        glowColor: "emerald",
        categorySlug: "devops",
    },
    {
        title: "Security",
        description: "Encryption, password tools, JWT, and security checkers.",
        tags: ["JWT", "Encrypt", "Password", "SSL"],
        icon: Shield,
        iconClassName:
            "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
        glowColor: "rose",
        categorySlug: "security",
    },
    {
        title: "Networking",
        description: "IP tools, DNS lookup, URL utilities, and network testing.",
        tags: ["IP", "DNS", "URL", "Ping"],
        icon: Network,
        iconClassName:
            "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
        glowColor: "violet",
        categorySlug: "networking",
    },
    {
        title: "Managers",
        description:
            "Sprint calculators, time zone helpers, and productivity tools.",
        tags: ["Time Zone", "Sprint", "Date Calc", "Diff"],
        icon: BarChart3,
        iconClassName:
            "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
        glowColor: "amber",
        categorySlug: "managers",
    },
    {
        title: "All Tools",
        description: "Browse every tool across all categories in one place.",
        tags: allTools.map((t) => t.name).slice(0, 4),
        icon: LayoutGrid,
        iconClassName:
            "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
        glowColor: "cyan",
        categorySlug: "__all__",
    },
];

// New tools (added within last 30 days — update this list as you ship tools)
const NEW_TOOL_SLUGS = ["diff-checker", "subnet-calculator", "cron-parser", "hash-generator", "uuid-generator", "json-formatter", "base64-encode", "base64-decode"];

export default function HomePanel() {
    const [recentTools, setRecentTools] = useState<{ name: string; slug: string; category: string }[]>([]);
    const { openTab } = useTabContext();

    useEffect(() => {
        setRecentTools(getRecentTools());
    }, []);

    const newTools = allTools.filter((t) => NEW_TOOL_SLUGS.includes(t.slug));

    return (
        <div className="space-y-10">
            {/* Hero */}
            <section className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                    Simple tools for everyday developer tasks
                </h1>
                <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
                    Fast, minimal, zero-config utilities built to help you ship code and
                    run your day-to-day work with less friction.
                </p>
            </section>

            {/* Tool categories */}
            <section className="grid gap-6 md:grid-cols-2">
                {TOOL_CATEGORIES.map(
                    ({
                        title,
                        description,
                        tags,
                        icon,
                        iconClassName,
                        cardClassName,
                        glowColor,
                        categorySlug,
                    }) => (
                        <ToolCategoryCard
                            key={title}
                            title={title}
                            description={description}
                            tags={tags}
                            icon={icon}
                            iconClassName={iconClassName}
                            cardClassName={cardClassName}
                            glowColor={glowColor}
                            categorySlug={categorySlug}
                        />
                    ),
                )}
            </section>

            {/* New tools */}
            {newTools.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                        ✨ Recently added
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {newTools.map((tool) => (
                            <button
                                key={tool.slug}
                                type="button"
                                onClick={() => openTab(tool)}
                                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-800 dark:border-emerald-600/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300"
                            >
                                <span className="text-[10px]">✦</span>
                                {tool.name}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Recently used */}
            {recentTools.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                        Recently used
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {recentTools.map((tool) => (
                            <button
                                key={tool.slug}
                                type="button"
                                onClick={() => openTab(tool)}
                                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
                            >
                                {tool.name}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 sm:flex-row">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span>© {new Date().getFullYear()} Toolich by <a href="https://cratonik.com" target="_blank"><b>Cratonik</b></a></span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <a
                        href="/privacy"
                        className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
                    >
                        Privacy
                    </a>
                    <a
                        href="/terms"
                        className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
                    >
                        Terms
                    </a>
                    <a
                        href="https://github.com/cratonik/toolich"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
                    >
                        GitHub
                    </a>
                </div>
                <div className="text-zinc-600 dark:text-zinc-400">
                    Built for engineers by <a href="https://chaitany.com" target="_blank"><b>Chaitanya Shimpi</b></a>
                </div>
            </footer>
        </div>
    );
}
