"use client";

import React, { useState, useEffect } from "react";
import { Bot, Keyboard, Maximize2, Minimize2, X, Megaphone } from "lucide-react";
import { useTabContext } from "@/lib/tab-context";
import { renderSlackText } from "@/lib/slack-format";
import { ShortcutHelp } from "@/components/ShortcutHelp";
import { FeedbackChatbot } from "@/components/FeedbackChatbot";

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

export default function GlobalFloatingDock() {
    const { isWide, toggleWide, activeTabId } = useTabContext();
    const [isOpenShortcuts, setIsOpenShortcuts] = useState(false);
    const [isOpenChatbot, setIsOpenChatbot] = useState(false);
    const [activeBroadcast, setActiveBroadcast] = useState<{ text: string; timestamp: number } | null>(null);
    const [hasNewBroadcast, setHasNewBroadcast] = useState(false);
    const [playedSoundTimestamp, setPlayedSoundTimestamp] = useState<number | null>(null);

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

    // Check for active Slack broadcasts on load and poll every 30 seconds
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
                console.warn("Failed to fetch announcements:", err);
            }
        };

        fetchBroadcast();
        const interval = setInterval(fetchBroadcast, 30000);
        return () => clearInterval(interval);
    }, []);

    // Only show Shortcuts and Wide View triggers on dynamic workspace pages (not home or static pages)
    const showWorkspaceTriggers = activeTabId !== "home";

    return (
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
                {showWorkspaceTriggers && (
                    <>
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
                    </>
                )}

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
}
