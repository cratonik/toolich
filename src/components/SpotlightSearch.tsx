"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

type SpotlightSearchProps = {
  placeholder?: string;
};

export function SpotlightSearch({ placeholder = "Quick search tools..." }: SpotlightSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle "/" key to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only open if not already open and not typing in an input
      if (e.key === "/" && !isOpen && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setIsOpen(true);
      }
      // Close on Escape
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-3 text-left text-sm shadow-sm transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
        aria-label="Open search"
      >
        <div className="flex flex-1 items-center gap-3">
          <Search className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <span className="text-zinc-500 dark:text-zinc-400">{placeholder}</span>
        </div>
        <kbd className="inline-flex h-6 items-center rounded border border-zinc-200 bg-zinc-50 px-2 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          /
        </kbd>
      </button>

      {/* Full-screen modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Search container */}
          <div
            className="relative w-full max-w-2xl px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/95">
              {/* Search input */}
              <div className="flex items-center gap-4 px-6 py-5">
                <Search className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent text-lg text-zinc-900 outline-none placeholder:text-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                  aria-label="Search tools"
                />
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Results area (placeholder for now) */}
              {query && (
                <div className="border-t border-zinc-200/50 px-6 py-4 dark:border-zinc-700/50">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Searching for &quot;{query}&quot;...
                  </p>
                </div>
              )}

              {/* Empty state */}
              {!query && (
                <div className="border-t border-zinc-200/50 px-6 py-8 dark:border-zinc-700/50">
                  <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Start typing to search for tools...
                  </p>
                </div>
              )}
            </div>

            {/* Keyboard hint */}
            <div className="mt-4 text-center">
              <div className="inline-flex gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                <kbd className="rounded border border-zinc-300 bg-zinc-100 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800">
                  Esc
                </kbd>
                <span>to close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
