"use client";

import { useState, useCallback, Suspense, useEffect } from "react";
import { useTabContext, type Tab } from "@/lib/tab-context";
import { getToolComponent } from "@/lib/tool-components";
import { getToolBySlug } from "@/lib/tool-registry";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import HomePanel from "@/components/HomePanel";
import CategoryPanel from "@/components/CategoryPanel";
import { SplitDivider } from "@/components/SplitDivider";
import { X, Pin, Maximize2, Minimize2, Keyboard, Bot } from "lucide-react";
import { FeedbackChatbot } from "@/components/FeedbackChatbot";
import { ShortcutHelp } from "@/components/ShortcutHelp";

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
    const [isOpenShortcuts, setIsOpenShortcuts] = useState(false);
    const [isOpenChatbot, setIsOpenChatbot] = useState(false);
    const [activeBroadcast, setActiveBroadcast] = useState<{ text: string; timestamp: number } | null>(null);
    const [hasNewBroadcast, setHasNewBroadcast] = useState(false);

    // Check for active Slack broadcasts on load and poll every 30 seconds
    // Suspends requests if tab is running in the background to protect server load
    useEffect(() => {
        const fetchBroadcast = async () => {
            if (document.hidden) return; // Skip requests if tab is backgrounded

            try {
                const res = await fetch("/api/broadcast");
                const data = await res.json();
                if (data.active) {
                    setActiveBroadcast({ text: data.text, timestamp: data.timestamp });
                    const hasSeen = localStorage.getItem(`seen-broadcast-${data.timestamp}`);
                    if (!hasSeen) {
                        setHasNewBroadcast(true);
                    }
                } else {
                    setActiveBroadcast(null);
                    setHasNewBroadcast(false);
                }
            } catch (err) {
                console.error("Failed to fetch active broadcast announcement:", err);
            }
        };

        fetchBroadcast();
        const interval = setInterval(fetchBroadcast, 30000); // 30-second interval is lightweight for prod

        // Instantly refetch when user returns to/focuses the tab
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchBroadcast();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

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

    const renderFloatingControls = () => (
        <>
            {/* Unified Floating Action Dock */}
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 p-0 md:p-1.5 rounded-full md:border md:border-zinc-200 md:bg-white/90 md:shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:backdrop-blur-md md:dark:border-zinc-800 md:dark:bg-zinc-950/90 transition-all duration-300">
                {/* Keyboard Shortcuts Trigger */}
                <button
                    type="button"
                    onClick={() => {
                        setIsOpenShortcuts((prev) => !prev);
                        setIsOpenChatbot(false);
                    }}
                    className={`hidden md:flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 ${
                        isOpenShortcuts
                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
                    }`}
                    title="Keyboard Shortcuts"
                >
                    <Keyboard className="h-[18px] w-[18px]" />
                </button>

                {/* Wide View Toggle Trigger */}
                <button
                    type="button"
                    onClick={toggleWide}
                    className="hidden md:flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 transition-all hover:scale-105 active:scale-95"
                    title={isWide ? "Switch to standard width" : "Switch to wide width"}
                >
                    {isWide ? <Minimize2 className="h-[18px] w-[18px]" /> : <Maximize2 className="h-[18px] w-[18px]" />}
                </button>

                {/* Subtle vertical divider */}
                <span className="hidden md:block h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

                {/* Feedback Chatbot Trigger */}
                <button
                    type="button"
                    onClick={() => {
                        setIsOpenChatbot((prev) => {
                            const next = !prev;
                            if (next && activeBroadcast) {
                                localStorage.setItem(`seen-broadcast-${activeBroadcast.timestamp}`, "true");
                                setHasNewBroadcast(false);
                            }
                            return next;
                        });
                        setIsOpenShortcuts(false);
                    }}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full text-white transition-all duration-300 hover:scale-110 active:scale-95 border-0 ${
                        isOpenChatbot
                            ? "bg-zinc-800 dark:bg-zinc-700 shadow-md"
                            : hasNewBroadcast
                                ? "bg-gradient-to-r from-rose-500 to-indigo-600 shadow-[0_0_15px_rgba(244,63,94,0.65)] ring-4 ring-rose-400/40 animate-pulse"
                                : "bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 shadow-[0_3px_12px_rgba(99,102,241,0.3)]"
                    }`}
                    title={isOpenChatbot ? "Close Assistant" : "Open Assistant & Feedback"}
                >
                    {isOpenChatbot ? (
                        <X className="h-4 w-4" />
                    ) : (
                        <>
                            <Bot className="h-[18px] w-[18px]" />
                            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                    hasNewBroadcast ? "bg-rose-400" : "bg-emerald-400"
                                }`}></span>
                                <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white dark:border-zinc-950 ${
                                    hasNewBroadcast ? "bg-rose-500" : "bg-emerald-500"
                                }`}></span>
                            </span>
                        </>
                    )}
                </button>
            </div>

            {/* Controlled Panels */}
            <ShortcutHelp isOpen={isOpenShortcuts} setIsOpen={setIsOpenShortcuts} />
            <FeedbackChatbot 
                isOpen={isOpenChatbot} 
                setIsOpen={setIsOpenChatbot} 
                activeBroadcast={activeBroadcast}
                onSeeBroadcast={() => {
                    if (activeBroadcast) {
                        localStorage.setItem(`seen-broadcast-${activeBroadcast.timestamp}`, "true");
                        setHasNewBroadcast(false);
                    }
                }}
            />
        </>
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

                {renderFloatingControls()}
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

            {renderFloatingControls()}
        </div>
    );
}
