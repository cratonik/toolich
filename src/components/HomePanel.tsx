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
const NEW_TOOL_SLUGS = ["markdown-editor","notepad", "notebook", "diff-checker", "subnet-calculator", "json-formatter", "base64-encode", "base64-decode"];

export default function HomePanel() {
    const [recentTools, setRecentTools] = useState<{ name: string; slug: string; category: string }[]>([]);
    const { openTab, favorites } = useTabContext();

    useEffect(() => {
        const tools = getRecentTools();
        const timer = setTimeout(() => {
            setRecentTools(tools);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const newTools = allTools.filter((t) => NEW_TOOL_SLUGS.includes(t.slug));
    const favoriteTools = allTools.filter((t) => favorites.includes(t.slug));

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

            {/* Favorite Tools */}
            {favoriteTools.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <span className="text-amber-500">⭐</span> Favorite Tools
                    </h2>
                    <div className="flex flex-wrap gap-2.5">
                        {favoriteTools.map((tool) => (
                            <button
                                key={tool.slug}
                                type="button"
                                onClick={() => openTab(tool)}
                                className="inline-flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/40 px-3.5 py-1.5 text-xs font-medium text-amber-800 shadow-sm transition-all duration-200 hover:border-amber-300 hover:bg-amber-50 hover:scale-105 active:scale-95 dark:border-amber-500/10 dark:bg-amber-500/5 dark:text-amber-300 dark:hover:border-amber-500/30 dark:hover:bg-amber-500/10"
                            >
                                <span className="text-amber-400 dark:text-amber-500">✦</span>
                                {tool.name}
                            </button>
                        ))}
                    </div>
                </section>
            )}

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

            {/* SEO and AdSense Content Section */}
            <section className="mt-16 border-t border-zinc-200 pt-12 pb-8 dark:border-zinc-800">
                <div className="max-w-3xl space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                            Why Use Toolich for Developer Utilities?
                        </h2>
                        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                            Toolich is a comprehensive suite of free, secure, and blazing-fast tools designed specifically for developers, DevOps engineers, and network administrators. Whether you need to encode sensitive payloads, generate secure passwords, or validate complex JSON schemas, Toolich provides a robust set of utilities that run directly in your browser. This client-side execution model ensures maximum performance and complete privacy.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                            Privacy and Security First
                        </h3>
                        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                            Unlike traditional online tools that transmit your data to remote servers for processing, Toolich is built on a "local-first" architecture. Your code snippets, environment variables, JWT tokens, and private keys never leave your machine. All formatting, decoding, and cryptographic hashing operations are performed securely inside your browser's sandboxed environment using optimized JavaScript and WebAssembly APIs.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                            Everything You Need in One Place
                        </h3>
                        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                            We've consolidated the most frequently used development tools into a single, cohesive interface. Forget bookmarking dozens of different ad-heavy sites with inconsistent interfaces. With Toolich, you can easily tab between a Markdown editor, a subnet calculator, and a cron expression parser—all within the same fast, distraction-free environment.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
