"use client";

import { useState, useCallback, Suspense, useEffect, createElement } from "react";
import { useTabContext, TabIdContext, type Tab, getTabDisplayTitle, getTabStorageSuffix } from "@/lib/tab-context";
import { getToolComponent } from "@/lib/tool-components";
import { getToolBySlug } from "@/lib/tool-registry";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import HomePanel from "@/components/HomePanel";
import CategoryPanel from "@/components/CategoryPanel";
import { SplitDivider } from "@/components/SplitDivider";
import { X, Columns2 } from "lucide-react";
import Footer from "@/components/Footer";
import { TOOL_GUIDES } from "@/lib/tool-guides";



function ToolLoadingFallback() {
    return (
        <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-500 dark:border-zinc-600 dark:border-t-indigo-400" />
        </div>
    );
}

function TabPanel({ tab }: { tab: Tab }) {
    const { tabs } = useTabContext();

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

    const guide = tab.toolSlug ? TOOL_GUIDES[tab.toolSlug] : null;

    return (
        <div className="space-y-12">
            <div>
                {meta && (
                    <ToolPageHeader
                        toolName={getTabDisplayTitle(tab, tabs)}
                        description={meta.description}
                        category={meta.category}
                        slug={meta.slug}
                    />
                )}
                <Suspense fallback={<ToolLoadingFallback />}>
                    {createElement(Component)}
                </Suspense>
            </div>

            {/* Educational Documentation Guide Section for AdSense and SEO */}
            {guide && (
                <article className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800 space-y-8 select-text">
                    <div className="space-y-6">
                        {/* Guide Header */}
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                            <span className="font-semibold text-xs uppercase tracking-wider">Documentation & User Guide</span>
                        </div>
                        
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                            {guide.title}
                        </h2>

                        {/* Introduction */}
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm">
                            {guide.introduction}
                        </p>

                        {/* Features & How To Use Split Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/30">
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-3 flex items-center gap-2">
                                    <span>⚙️</span> Key Features
                                </h3>
                                <ul className="list-disc pl-5 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                                    {guide.features.map((feature, i) => (
                                        <li key={i}>{feature}</li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/30">
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-3 flex items-center gap-2">
                                    <span>📖</span> How to Use
                                </h3>
                                <ol className="list-decimal pl-5 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                                    {guide.howToUse.map((step, i) => (
                                        <li key={i}>{step}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>

                        {/* Security & Privacy Callout */}
                        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/30 p-4 dark:border-emerald-900/20 dark:bg-emerald-950/5 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
                            <span className="mt-0.5 text-[14px]">🔒</span>
                            <div className="space-y-0.5">
                                <span className="font-semibold text-emerald-900 dark:text-emerald-400">Privacy & Security:</span>
                                <p className="text-emerald-700/90 dark:text-emerald-400/80 leading-relaxed">{guide.securityInfo}</p>
                            </div>
                        </div>

                        {/* FAQ Section */}
                        {guide.faq.length > 0 && (
                            <div className="space-y-4 pt-4">
                                <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                                    Frequently Asked Questions (FAQ)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {guide.faq.map((item, i) => (
                                        <div key={i} className="space-y-1.5 p-4 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800/60 dark:bg-zinc-900/20">
                                            <h4 className="font-medium text-xs text-zinc-900 dark:text-zinc-200">
                                                {item.question}
                                            </h4>
                                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                {item.answer}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </article>
            )}
        </div>
    );
}

export function TabContent() {
    const { tabs, activeTabId, splitTabId, splitRatio, splitTab, unsplit, setSplitRatio, isWide, splitHighlightTrigger } = useTabContext();
    const [dropTarget, setDropTarget] = useState(false);
    const [isHighlighting, setIsHighlighting] = useState(false);

    useEffect(() => {
        if (splitHighlightTrigger > 0) {
            const hId = setTimeout(() => {
                setIsHighlighting(true);
            }, 0);
            const timer = setTimeout(() => {
                setIsHighlighting(false);
            }, 800);
            return () => {
                clearTimeout(hId);
                clearTimeout(timer);
            };
        }
    }, [splitHighlightTrigger]);

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

    return (
        <div
            className={`relative flex min-h-screen bg-zinc-50 dark:bg-zinc-950 ${
                !isSplit && activeTabId !== "home" && dropTarget ? "ring-2 ring-inset ring-indigo-400/40" : ""
            }`}
            onDragOver={!isSplit && activeTabId !== "home" ? handleDragOver : undefined}
            onDragLeave={!isSplit && activeTabId !== "home" ? handleDragLeave : undefined}
            onDrop={!isSplit && activeTabId !== "home" ? handleDrop : undefined}
        >
            {/* Drop overlay for splitting (only shown when not split and active tab is not home) */}
            {!isSplit && activeTabId !== "home" && dropTarget && (
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-1/2 items-center justify-center bg-indigo-500/5 backdrop-blur-[1px]">
                    <div className="rounded-lg border-2 border-dashed border-indigo-400 bg-white/80 px-6 py-3 text-sm font-medium text-indigo-600 shadow-sm dark:bg-zinc-900/80 dark:text-indigo-400">
                        Drop to split view
                    </div>
                </div>
            )}

            {/* Flex Container for side-by-side tabs */}
            <div className="flex w-full items-stretch overflow-hidden">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    const isSplitTab = isSplit && tab.id === splitTabId;
                    const isVisible = isActive || isSplitTab;

                    // Determine width, padding, and order dynamically
                    let widthStyle = "0px";
                    let orderStyle = 4;
                    let displayHeader = false;

                    if (isActive) {
                        widthStyle = isSplit ? `${splitRatio * 100}%` : "100%";
                        orderStyle = 1;
                    } else if (isSplitTab) {
                        widthStyle = `${(1 - splitRatio) * 100}%`;
                        orderStyle = 3;
                        displayHeader = true;
                    }

                    return (
                        <div
                            key={tab.id}
                            style={{
                                width: widthStyle,
                                order: orderStyle,
                                display: isVisible ? "flex" : "none",
                            }}
                            className={`flex-col overflow-y-auto transition-all duration-300 ${
                                isSplitTab && dropTarget ? "ring-2 ring-inset ring-indigo-400/40" : ""
                            } ${
                                isSplitTab && isHighlighting
                                    ? "ring-4 ring-indigo-500/50 dark:ring-indigo-400/50 scale-[1.005] shadow-lg z-20"
                                    : ""
                            }`}
                            onDragOver={isSplitTab ? handleDragOver : undefined}
                            onDragLeave={isSplitTab ? handleDragLeave : undefined}
                            onDrop={isSplitTab ? handleDrop : undefined}
                        >
                            {/* Split pane header (only for split tab) */}
                            {displayHeader && (
                                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-2 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
                                    <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                        <Columns2 className="h-3.5 w-3.5" />
                                        <span>{getTabDisplayTitle(tab, tabs)} (Split View)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={unsplit}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500 transition-all hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                                        title="Close Split View"
                                    >
                                        <X className="h-3 w-3" />
                                        Close Split
                                    </button>
                                </div>
                            )}

                            {/* Drop overlay for swapping (only shown when split) */}
                            {isSplitTab && dropTarget && (
                                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-indigo-500/5 backdrop-blur-[1px]">
                                    <div className="rounded-lg border-2 border-dashed border-indigo-400 bg-white/80 px-6 py-3 text-sm font-medium text-indigo-600 shadow-sm dark:bg-zinc-900/80 dark:text-indigo-400">
                                        Drop to swap split tool
                                    </div>
                                </div>
                            )}

                            {/* Tab Panel Content */}
                            <div className={`flex-1 px-4 pt-6 pb-10 sm:px-6 ${!isSplit ? "lg:px-8" : ""}`}>
                                <div className={!isSplit ? `mx-auto ${isWide ? "max-w-[94%]" : "max-w-5xl"} transition-all duration-300` : "mx-auto max-w-none"}>
                                    <TabIdContext.Provider value={getTabStorageSuffix(tab, tabs)}>
                                        <TabPanel tab={tab} />
                                    </TabIdContext.Provider>
                                </div>
                            </div>

                            {/* Footer */}
                            <Footer />

                        </div>
                    );
                })}

                {/* Resizable Divider (positioned in between active and split tab via order style) */}
                {isSplit && (
                    <div style={{ order: 2 }}>
                        <SplitDivider ratio={splitRatio} onRatioChange={setSplitRatio} />
                    </div>
                )}
            </div>
        </div>
    );
}
