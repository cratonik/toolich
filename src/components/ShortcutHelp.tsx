"use client";

import { useState, useEffect } from "react";
import { Keyboard, X } from "lucide-react";

const SHORTCUTS = [
    { keys: ["⌘", "K"], label: "Search tools", winKeys: ["Ctrl", "K"] },
    { keys: ["⌥", "1-9"], label: "Switch tab", winKeys: ["Alt", "1-9"] },
    { keys: ["⌥", "1-9", "W"], label: "Close tab", winKeys: ["Alt", "1-9", "W"] },
    { keys: ["⌥", "P"], label: "Pin / unpin tab", winKeys: ["Alt", "P"] },
    { keys: ["?"], label: "Toggle shortcut help", winKeys: ["?"] },
    { keys: ["↑", "↓"], label: "Navigate search results" },
    { keys: ["↵"], label: "Select search result" },
    { keys: ["Esc"], label: "Close modal / search" },
];

interface ShortcutHelpProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function ShortcutHelp({ isOpen, setIsOpen }: ShortcutHelpProps) {
    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
        setIsMac(navigator.userAgent.toLowerCase().includes("mac"));
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger when typing in inputs
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

            if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                setIsOpen(!isOpen);
            }
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, setIsOpen]);

    return (
        <>
            {/* Shortcut panel */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[55]"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="fixed bottom-20 right-6 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-zinc-700/60 dark:bg-zinc-900/95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-zinc-200/50 px-4 py-3 dark:border-zinc-700/50">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Keyboard Shortcuts
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                                aria-label="Close"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* Shortcuts list */}
                        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {SHORTCUTS.map((shortcut) => {
                                const keys =
                                    !isMac && shortcut.winKeys
                                        ? shortcut.winKeys
                                        : shortcut.keys;
                                return (
                                    <li
                                        key={shortcut.label}
                                        className="flex items-center justify-between px-4 py-2.5"
                                    >
                                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                            {shortcut.label}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {keys.map((key) => (
                                                <kbd
                                                    key={key}
                                                    className="inline-flex min-w-[22px] items-center justify-center rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* Footer hint */}
                        <div className="border-t border-zinc-200/50 px-4 py-2 dark:border-zinc-700/50">
                            <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500">
                                Press <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-[10px] dark:border-zinc-600 dark:bg-zinc-800">?</kbd> to toggle
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
