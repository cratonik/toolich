import Link from "next/link";
import { BarChart3, ArrowRight } from "lucide-react";
import { getToolsByCategory } from "@/lib/tool-registry";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
    title: "Manager Tools",
    description: "Markdown editor, side-by-side text diff checkers, and productivity tools for project managers and developers.",
    path: "/tools/managers",
    keywords: ["manager tools", "markdown editor", "diff checker", "productivity utilities"],
});

export default function ManagersPage() {
    const tools = getToolsByCategory("managers");

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                            Manager Tools
                        </h1>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Sprint calculators, time zone helpers, and productivity tools.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tool grid */}
            <div className="grid gap-4 sm:grid-cols-2">
                {tools.map((tool) => (
                    <Link
                        key={tool.slug}
                        href={tool.path}
                        className="group relative flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 no-underline hover:border-amber-300 hover:shadow-lg hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-amber-500/40"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                {tool.name}
                            </h2>
                            <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500 dark:text-zinc-500 dark:group-hover:text-amber-400" />
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
                    </Link>
                ))}
            </div>

            {/* Empty state */}
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
