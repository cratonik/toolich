"use client";

import { useEffect, useRef, useState } from "react";
import { Home, X, Columns2 } from "lucide-react";
import { useTabContext, getTabDisplayTitle } from "@/lib/tab-context";
import { useToast } from "@/components/Toast";

export function TabBar() {
    const { tabs, activeTabId, switchTab, closeTab, splitTab, unsplit, splitTabId, reorderTab, maxTabs, isWide } = useTabContext();
    const { showToast } = useToast();
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragSourceIndex = useRef<number | null>(null);
    const warnedRef = useRef(false);

    // Toast when nearing max tabs
    useEffect(() => {
        if (tabs.length >= 8 && !warnedRef.current) {
            warnedRef.current = true;
            showToast(`You have ${tabs.length} tabs open. Maximum is ${maxTabs}.`, "warning");
        }
        if (tabs.length < 8) {
            warnedRef.current = false;
        }
    }, [tabs.length, maxTabs, showToast]);

    // Alt/Option + 1-9 to switch tabs, Alt + digit then W to close, Alt + P to split/unsplit
    const lastAltDigitRef = useRef<string | null>(null);
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!e.altKey) return;

            // Alt + W → close the tab that was last selected by Alt+digit
            if (e.code === "KeyW" && lastAltDigitRef.current) {
                e.preventDefault();
                const tabId = lastAltDigitRef.current;
                if (tabId !== "home") {
                    closeTab(tabId);
                }
                lastAltDigitRef.current = null;
                return;
            }

            // Alt + P → toggle split on the active tab
            if (e.code === "KeyP") {
                e.preventDefault();
                if (activeTabId === "home") return;
                if (splitTabId === activeTabId) {
                    unsplit();
                } else {
                    splitTab(activeTabId);
                }
                return;
            }

            // Alt + digit → switch tab
            const match = e.code.match(/^Digit(\d)$/);
            if (!match) return;
            const digit = parseInt(match[1], 10);
            if (digit >= 1 && digit <= 9 && digit <= tabs.length) {
                e.preventDefault();
                const tab = tabs[digit - 1];
                switchTab(tab.id);
                lastAltDigitRef.current = tab.id;
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Alt") lastAltDigitRef.current = null;
        };
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        };
    }, [tabs, switchTab, closeTab, splitTab, unsplit, splitTabId, activeTabId]);

    // Hide split button on small screens
    const [canSplit, setCanSplit] = useState(false);
    useEffect(() => {
        const check = () => setCanSplit(window.innerWidth >= 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    return (
        <div className="sticky top-14 z-30 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className={`mx-auto ${isWide ? "max-w-[94%]" : "max-w-5xl"} px-4 sm:px-6 transition-all duration-300`}>
                <div className="-mb-px flex items-center gap-0.5 overflow-x-auto scrollbar-none">
                    {tabs.map((tab, index) => {
                        const isActive = tab.id === activeTabId;
                        const isHome = tab.id === "home";
                        const isSplit = tab.id === splitTabId;
                        const tabNumber = index + 1;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                draggable={!isHome}
                                onClick={() => switchTab(tab.id)}
                                onDragStart={(e) => {
                                    if (isHome) {
                                        e.preventDefault();
                                        return;
                                    }
                                    dragSourceIndex.current = index;
                                    e.dataTransfer.setData("text/tab-id", tab.id);
                                    e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    if (!isHome && dragSourceIndex.current !== null && dragSourceIndex.current !== index) {
                                        setDragOverIndex(index);
                                    }
                                }}
                                onDragLeave={() => setDragOverIndex(null)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverIndex(null);
                                    if (dragSourceIndex.current !== null && !isHome) {
                                        reorderTab(dragSourceIndex.current, index);
                                    }
                                    dragSourceIndex.current = null;
                                }}
                                onDragEnd={() => {
                                    setDragOverIndex(null);
                                    dragSourceIndex.current = null;
                                }}
                                className={`group relative flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${dragOverIndex === index
                                    ? "border-indigo-300 bg-indigo-50/50 dark:border-indigo-500/50 dark:bg-indigo-500/10"
                                    : isActive
                                        ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                                        : isSplit
                                            ? "border-emerald-400 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400"
                                            : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
                                    }`}
                            >
                                {/* Tab number (skip Home) */}
                                {!isHome && tabNumber <= 9 && (
                                    <span className="text-[10px] opacity-30">
                                        {tabNumber}
                                    </span>
                                )}
                                {isHome && <Home className="h-3.5 w-3.5" />}
                                <span className="max-w-[120px] truncate">{getTabDisplayTitle(tab, tabs)}</span>

                                {/* Split view button (not for Home, only on screens >= tablet, not for active tab, and not when active tab is Home) */}
                                {!isHome && !isActive && canSplit && activeTabId !== "home" && (
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isSplit) {
                                                unsplit();
                                            } else {
                                                splitTab(tab.id);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.stopPropagation();
                                                if (isSplit) {
                                                    unsplit();
                                                } else {
                                                    splitTab(tab.id);
                                                }
                                            }
                                        }}
                                        className={`ml-0.5 flex h-4 w-4 items-center justify-center rounded transition-opacity hover:bg-zinc-200 dark:hover:bg-zinc-700 ${isSplit
                                            ? "opacity-100 text-emerald-500"
                                            : "opacity-0 group-hover:opacity-100"
                                            }`}
                                        aria-label={isSplit ? `Close Split View for ${getTabDisplayTitle(tab, tabs)}` : `Split View for ${getTabDisplayTitle(tab, tabs)}`}
                                        title={isSplit ? "Close Split View" : "Split View"}
                                    >
                                        <Columns2 className="h-3 w-3" />
                                    </span>
                                )}

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
                                        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded opacity-0 transition-opacity hover:bg-zinc-200 group-hover:opacity-100 dark:hover:bg-zinc-700"
                                        aria-label={`Close ${getTabDisplayTitle(tab, tabs)}`}
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
