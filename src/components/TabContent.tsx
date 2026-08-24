"use client";

import { useState, useCallback, Suspense, useEffect, createElement } from "react";
import { useTabContext, TabIdContext, type Tab, getTabDisplayTitle, getTabStorageSuffix } from "@/lib/tab-context";
import { getToolComponent } from "@/lib/tool-components";
import { getToolBySlug } from "@/lib/tool-registry";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import HomePanel from "@/components/HomePanel";
import CategoryPanel from "@/components/CategoryPanel";
import { SplitDivider } from "@/components/SplitDivider";
import { X, Columns2, Maximize2, Minimize2, Keyboard, Bot, Megaphone } from "lucide-react";
import { FeedbackChatbot } from "@/components/FeedbackChatbot";
import { ShortcutHelp } from "@/components/ShortcutHelp";
import Footer from "@/components/Footer";
import { renderSlackText } from "@/lib/slack-format";
import { TOOL_GUIDES } from "@/lib/tool-guides";

function playNotificationSound() {
    try {
        const AudioContextClass = typeof window !== "undefined" 
            ? (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) 
            : null;
        if (!AudioContextClass) return;
        const audioCtx = new AudioContextClass();
        
        const play = () => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High chime A5
            
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
            
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.5);
        };

        if (audioCtx.state === "suspended") {
            const resumeAndPlay = () => {
                audioCtx.resume().then(() => {
                    play();
                    document.removeEventListener("click", resumeAndPlay);
                    document.removeEventListener("keydown", resumeAndPlay);
                }).catch(err => console.warn("Failed to resume audio context:", err));
            };
            document.addEventListener("click", resumeAndPlay);
            document.addEventListener("keydown", resumeAndPlay);
        } else {
            play();
        }
    } catch (err) {
        console.warn("Failed to play synthesized sound:", err);
    }
}



function ToolLoadingFallback() {
    return (
        <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-500 dark:border-zinc-600 dark:border-t-indigo-400" />
        </div>
    );
}

function TabPanel({ tab }: { tab: Tab }) {
    const { tabs, viewMode } = useTabContext();

    useEffect(() => {
        const container = document.getElementById(`tab-scroll-${tab.id}`);
        if (container) {
            container.scrollTop = 0;
        }
    }, [tab.toolSlug, tab.id]);

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
                        hideOpenAgain={meta.slug === "http-status-codes"}
                    />
                )}
                <Suspense fallback={<ToolLoadingFallback />}>
                    {createElement(Component)}
                </Suspense>
            </div>

            {/* Educational Documentation Guide Section for AdSense and SEO */}
            {guide && viewMode === "normal" && (
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
    const { tabs, activeTabId, splitTabId, splitRatio, splitTab, unsplit, setSplitRatio, isWide, toggleWide, splitHighlightTrigger } = useTabContext();
    const [dropTarget, setDropTarget] = useState(false);
    const [isOpenShortcuts, setIsOpenShortcuts] = useState(false);
    const [isOpenChatbot, setIsOpenChatbot] = useState(false);
    const [activeBroadcast, setActiveBroadcast] = useState<{ text: string; timestamp: number } | null>(null);
    const [hasNewBroadcast, setHasNewBroadcast] = useState(false);
    const [playedSoundTimestamp, setPlayedSoundTimestamp] = useState<number | null>(null);
    const [isHighlighting, setIsHighlighting] = useState(false);

    // Listen to custom event to open assistant programmatically
    useEffect(() => {
        const handleOpen = () => setIsOpenChatbot(true);
        window.addEventListener('open-toolich-assistant', handleOpen);
        return () => window.removeEventListener('open-toolich-assistant', handleOpen);
    }, []);

    // Get the active tab to track its changes
    const activeTab = tabs.find((t) => t.id === activeTabId);

    // Scroll to top when active tab changes or its content changes
    useEffect(() => {
        if (activeTab) {
            window.scrollTo({ top: 0, behavior: "auto" });
            const container = document.getElementById(`tab-scroll-${activeTab.id}`);
            if (container) {
                container.scrollTop = 0;
            }
        }
    }, [activeTabId, activeTab?.toolSlug, activeTab?.category]);

    // Play chime when new broadcast is loaded
    useEffect(() => {
        if (hasNewBroadcast && activeBroadcast && playedSoundTimestamp !== activeBroadcast.timestamp) {
            playNotificationSound();
            const timer = setTimeout(() => {
                setPlayedSoundTimestamp(activeBroadcast.timestamp);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [hasNewBroadcast, activeBroadcast, playedSoundTimestamp]);

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
            {/* New Broadcast Tooltip Speech Bubble */}
            {hasNewBroadcast && activeBroadcast && !isOpenChatbot && (
                <div 
                    className="fixed bottom-20 right-6 z-50 max-w-xs scale-95 md:scale-100 origin-bottom-right rounded-2xl border border-rose-200 bg-rose-50 p-3 shadow-xl dark:border-rose-900/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200"
                >
                    {/* Speech bubble arrow pointing down */}
                    <div className="absolute right-4 bottom-[-6px] h-3 w-3 rotate-45 border-r border-b border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20" />
                    
                    <div className="flex items-start gap-2.5 text-xs">
                        <Megaphone className="h-4 w-4 shrink-0 text-rose-500 animate-pulse mt-0.5" />
                        <div className="flex-1">
                            <div className="font-bold text-rose-600 dark:text-rose-400 mb-0.5">New Announcement:</div>
                            <p className="leading-relaxed line-clamp-3 font-medium">{renderSlackText(activeBroadcast.text)}</p>
                        </div>
                    </div>
                </div>
            )}

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
                            id={`tab-scroll-${tab.id}`}
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

            {renderFloatingControls()}
        </div>
    );
}
