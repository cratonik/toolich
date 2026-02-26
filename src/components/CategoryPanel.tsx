"use client";

import { Code, Server, Shield, Network, BarChart3, LayoutGrid, ArrowRight, ArrowLeft } from "lucide-react";
import { getToolsByCategory, allTools } from "@/lib/tool-registry";
import { useTabContext } from "@/lib/tab-context";
import { CATEGORY_LABELS } from "@/lib/routes";
import type { LucideIcon } from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
    developers: Code,
    devops: Server,
    security: Shield,
    networking: Network,
    managers: BarChart3,
    __all__: LayoutGrid,
};

const CATEGORY_ICON_CLASSES: Record<string, string> = {
    developers:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
    devops:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    security:
        "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    networking:
        "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    managers:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    __all__:
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
};

export default function CategoryPanel({ category }: { category: string }) {
    const tools = category === "__all__" ? allTools : getToolsByCategory(category);
    const { openInCurrentTab, goHome, activeTabId } = useTabContext();
    const Icon = CATEGORY_ICONS[category] ?? Code;
    const iconClass = CATEGORY_ICON_CLASSES[category] ?? "";
    const isInHomeTab = activeTabId === "home";

    return (
        <div className="space-y-8">
            {/* Back button (only when opened inside Home tab) */}
            {isInHomeTab && (
                <button
                    type="button"
                    onClick={goHome}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </button>
            )}

            {/* Header */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClass}`}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                            {CATEGORY_LABELS[category] ?? category} Tools
                        </h1>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {tools.length} tool{tools.length !== 1 ? "s" : ""} available
                        </p>
                    </div>
                </div>
            </div>

            {/* Tool grid */}
            <div className="grid gap-4 sm:grid-cols-2">
                {tools.map((tool) => (
                    <button
                        key={tool.slug}
                        type="button"
                        onClick={() =>
                            openInCurrentTab({
                                name: tool.name,
                                slug: tool.slug,
                                category: tool.category,
                            })
                        }
                        className="group relative flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-500/40"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                {tool.name}
                            </h2>
                            <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500 dark:text-zinc-500 dark:group-hover:text-indigo-400" />
                        </div>
                        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                            {tool.description}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                            {tool.keywords.slice(0, 3).map((kw) => (
                                <span
                                    key={kw}
                                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                                >
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </button>
                ))}
            </div>

            {tools.length === 0 && (
                <div className="rounded-xl border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No tools in this category yet. Check back soon!
                    </p>
                </div>
            )}
        </div>
    );
}
