"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { allTools, type ToolMetaWithPath } from "@/lib/tool-registry";
import { CATEGORY_LABELS } from "@/lib/routes";
import { useTabContext } from "@/lib/tab-context";

// ---------------------------------------------------------------------------
// Shared context so Trigger and Modal can communicate
// ---------------------------------------------------------------------------
type SearchContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const SearchContext = createContext<SearchContextType>({
  isOpen: false,
  open: () => { },
  close: () => { },
});

function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when open
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

  return (
    <SearchContext.Provider
      value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
    </SearchContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Trigger button (goes in the Header)
// ---------------------------------------------------------------------------
function Trigger() {
  const { open } = useContext(SearchContext);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.userAgent.toLowerCase().includes("mac"));
  }, []);

  return (
    <button
      type="button"
      onClick={open}
      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-500 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
      aria-label="Search tools"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Search</span>
      <kbd className="ml-1 hidden rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium dark:border-zinc-600 dark:bg-zinc-700 sm:inline">
        {isMac ? "⌘" : "Ctrl+"}K
      </kbd>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Modal (rendered once at the layout level)
// ---------------------------------------------------------------------------
function Modal() {
  const { isOpen, close } = useContext(SearchContext);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ToolMetaWithPath[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { openTab } = useTabContext();

  // Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }
    const q = query.toLowerCase().trim();
    const filtered = allTools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q)) ||
        t.category.includes(q),
    );
    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const navigateToTool = (tool: ToolMetaWithPath) => {
    close();
    openTab({ name: tool.name, slug: tool.slug, category: tool.category });
  };

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigateToTool(results[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  const isMac =
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("mac");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh]"
      onClick={close}
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
              onKeyDown={handleKeyNavigation}
              placeholder="Search tools…"
              className="flex-1 bg-transparent text-lg text-zinc-900 outline-none placeholder:text-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              aria-label="Search tools"
            />
            <button
              type="button"
              onClick={close}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          {query && results.length > 0 && (
            <div className="border-t border-zinc-200/50 dark:border-zinc-700/50">
              <ul className="max-h-64 overflow-y-auto py-2">
                {results.map((tool, i) => (
                  <li key={tool.slug}>
                    <button
                      type="button"
                      onClick={() => navigateToTool(tool)}
                      className={`flex w-full items-center justify-between px-6 py-3 text-left transition-colors ${i === selectedIndex
                        ? "bg-indigo-50 dark:bg-indigo-500/10"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        }`}
                    >
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {tool.name}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {CATEGORY_LABELS[tool.category] ?? tool.category} ·{" "}
                          {tool.description}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No results */}
          {query && results.length === 0 && (
            <div className="border-t border-zinc-200/50 px-6 py-8 dark:border-zinc-700/50">
              <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                No tools found for &quot;{query}&quot;
              </p>
            </div>
          )}

          {/* Empty state */}
          {!query && (
            <div className="border-t border-zinc-200/50 px-6 py-8 dark:border-zinc-700/50">
              <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                Start typing to search {allTools.length} tool
                {allTools.length !== 1 ? "s" : ""}…
              </p>
            </div>
          )}
        </div>

        {/* Keyboard hints */}
        <div className="mt-4 text-center">
          <div className="inline-flex gap-4 text-xs text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 dark:border-zinc-700 dark:bg-zinc-800">
                ↑↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 dark:border-zinc-700 dark:bg-zinc-800">
                ↵
              </kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 dark:border-zinc-700 dark:bg-zinc-800">
                {isMac ? "⌘" : "Ctrl+"}K
              </kbd>
              toggle
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Named exports
// ---------------------------------------------------------------------------
export { SearchProvider as SearchProvider };
export { Trigger as SearchTrigger };
export { Modal as SearchModal };
