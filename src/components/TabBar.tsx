"use client";

import { Home, X } from "lucide-react";
import { useTabContext } from "@/lib/tab-context";

export function TabBar() {
    const { tabs, activeTabId, switchTab, closeTab } = useTabContext();

    return (
        <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <div className="-mb-px flex items-center gap-0.5 overflow-x-auto scrollbar-none">
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeTabId;
                        const isHome = tab.id === "home";

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => switchTab(tab.id)}
                                className={`group relative flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${isActive
                                        ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                                        : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
                                    }`}
                            >
                                {isHome && <Home className="h-3.5 w-3.5" />}
                                <span className="max-w-[120px] truncate">{tab.title}</span>

                                {/* Close button (not for Home) */}
                                {!isHome && (
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closeTab(tab.id);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.stopPropagation();
                                                closeTab(tab.id);
                                            }
                                        }}
                                        className="ml-1 flex h-4 w-4 items-center justify-center rounded opacity-0 transition-opacity hover:bg-zinc-200 group-hover:opacity-100 dark:hover:bg-zinc-700"
                                        aria-label={`Close ${tab.title}`}
                                    >
                                        <X className="h-3 w-3" />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
