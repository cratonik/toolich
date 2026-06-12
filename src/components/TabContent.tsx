"use client";

import { useState, useCallback, Suspense } from "react";
import { useTabContext, type Tab } from "@/lib/tab-context";
import { getToolComponent } from "@/lib/tool-components";
import { getToolBySlug } from "@/lib/tool-registry";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import HomePanel from "@/components/HomePanel";
import CategoryPanel from "@/components/CategoryPanel";
import { SplitDivider } from "@/components/SplitDivider";
import { X, Pin, Maximize2, Minimize2 } from "lucide-react";

function ToolLoadingFallback() {
    return (
        <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-500 dark:border-zinc-600 dark:border-t-indigo-400" />
        </div>
    );
}

function TabPanel({ tab }: { tab: Tab }) {
    // Home tab
    if (tab.toolSlug === null) {
        return <HomePanel />;
    }

    // Category listing tab
    if (tab.toolSlug?.startsWith("__category__/")) {
        const category = tab.toolSlug.replace("__category__/", "");
        return <CategoryPanel category={category} />;
    }

    // Tool tab
    const Component = getToolComponent(tab.category!, tab.toolSlug!);
    const meta = getToolBySlug(tab.category!, tab.toolSlug!);

    if (!Component) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-zinc-500 dark:text-zinc-400">
                Tool not found.
            </div>
        );
    }

    return (
        <div>
            {meta && (
                <ToolPageHeader
                    toolName={meta.name}
                    description={meta.description}
                    category={meta.category}
                />
            )}
            <Suspense fallback={<ToolLoadingFallback />}>
                <Component />
            </Suspense>
        </div>
    );
}

export function TabContent() {
    const { tabs, activeTabId, splitTabId, splitRatio, splitTab, unsplit, setSplitRatio, isWide, toggleWide } = useTabContext();
    const [dropTarget, setDropTarget] = useState(false);

    const activeTab = tabs.find((t) => t.id === activeTabId);
    const splitTabData = splitTabId ? tabs.find((t) => t.id === splitTabId) : null;
    const isSplit = !!splitTabData;

    // Drop zone handlers for creating a split
    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            const tabId = e.dataTransfer.types.includes("text/tab-id");
            if (tabId) setDropTarget(true);
        },
        [],
    );

    const handleDragLeave = useCallback(() => {
        setDropTarget(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDropTarget(false);
            const tabId = e.dataTransfer.getData("text/tab-id");
            if (tabId && tabId !== "home") {
                splitTab(tabId);
            }
        },
        [splitTab],
    );

    // Split/pin view
    if (isSplit && activeTab) {
        return (
            <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
                {/* Left pane */}
                <div
                    className="overflow-y-auto px-4 pt-6 pb-10 sm:px-6"
                    style={{ width: `${splitRatio * 100}%` }}
                >
                    <div className="mx-auto max-w-none">
                        <TabPanel tab={activeTab} />
                    </div>
                </div>

                {/* Resizable divider */}
                <SplitDivider ratio={splitRatio} onRatioChange={setSplitRatio} />

                {/* Right pane (pinned) */}
                <div
                    className={`relative flex flex-col overflow-y-auto ${dropTarget ? "ring-2 ring-inset ring-indigo-400/40" : ""
                        }`}
                    style={{ width: `${(1 - splitRatio) * 100}%` }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* Pinned pane header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-2 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <Pin className="h-3.5 w-3.5" />
                            <span>{splitTabData.title}</span>
                        </div>
                        <button
                            type="button"
                            onClick={unsplit}
                            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500 transition-all hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                            title="Unpin"
                        >
                            <X className="h-3 w-3" />
                            Unpin
                        </button>
                    </div>
                    {dropTarget && (
                        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-indigo-500/5 backdrop-blur-[1px]">
                            <div className="rounded-lg border-2 border-dashed border-indigo-400 bg-white/80 px-6 py-3 text-sm font-medium text-indigo-600 shadow-sm dark:bg-zinc-900/80 dark:text-indigo-400">
                                Drop to swap pinned tool
                            </div>
                        </div>
                    )}
                    <div className="flex-1 px-4 pt-6 pb-10 sm:px-6">
                        <div className="mx-auto max-w-none">
                            <TabPanel tab={splitTabData} />
                        </div>
                    </div>
                </div>

                {/* Floating Expand/Shrink View Button */}
                <button
                    type="button"
                    onClick={toggleWide}
                    className="fixed bottom-6 right-20 z-40 hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white/85 shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/85 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    title={isWide ? "Switch to standard width" : "Switch to wide width"}
                >
                    {isWide ? (
                        <Minimize2 className="h-5 w-5" />
                    ) : (
                        <Maximize2 className="h-5 w-5" />
                    )}
                </button>
            </div>
        );
    }

    // Normal single-pane view
    return (
        <div
            className={`relative min-h-screen bg-zinc-50 px-4 pt-6 pb-10 dark:bg-zinc-950 sm:px-6 lg:px-8 ${dropTarget ? "ring-2 ring-inset ring-indigo-400/40" : ""
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drop overlay */}
            {dropTarget && (
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-1/2 items-center justify-center rounded-r-xl bg-indigo-500/5 backdrop-blur-[1px]">
                    <div className="rounded-lg border-2 border-dashed border-indigo-400 bg-white/80 px-6 py-3 text-sm font-medium text-indigo-600 shadow-sm dark:bg-zinc-900/80 dark:text-indigo-400">
                        Drop to split view
                    </div>
                </div>
            )}
            <div className={`mx-auto ${isWide ? "max-w-[94%]" : "max-w-5xl"} transition-all duration-300`}>
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        style={{ display: tab.id === activeTabId ? "block" : "none" }}
                    >
                        <TabPanel tab={tab} />
                    </div>
                ))}
            </div>

            {/* Floating Expand/Shrink View Button */}
            <button
                type="button"
                onClick={toggleWide}
                className="fixed bottom-6 right-20 z-40 hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white/85 shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/85 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                title={isWide ? "Switch to standard width" : "Switch to wide width"}
            >
                {isWide ? (
                    <Minimize2 className="h-5 w-5" />
                ) : (
                    <Maximize2 className="h-5 w-5" />
                )}
            </button>
        </div>
    );
}
