"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
    type ReactNode,
} from "react";
import { getToolBySlug, getToolsByCategory } from "@/lib/tool-registry";
import { toolPath, categoryPath } from "@/lib/routes";
import { trackToolUsage } from "@/lib/recent-tools";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Tab = {
    /** Unique identifier for this tab instance */
    id: string;
    /** Display title in the tab bar */
    title: string;
    /** Tool slug (null = Home tab) */
    toolSlug: string | null;
    /** Category slug (null = Home tab) */
    category: string | null;
};

type TabContextType = {
    tabs: Tab[];
    activeTabId: string;
    splitTabId: string | null;
    splitRatio: number;
    maxTabs: number;
    isWide: boolean;
    toggleWide: () => void;
    openTab: (tool: { name: string; slug: string; category: string }) => void;
    openInCurrentTab: (tool: {
        name: string;
        slug: string;
        category: string;
    }) => void;
    openCategoryInCurrentTab: (category: string, title: string) => boolean;
    closeTab: (id: string) => void;
    switchTab: (id: string) => void;
    splitTab: (id: string) => void;
    unsplit: () => void;
    setSplitRatio: (ratio: number) => void;
    reorderTab: (fromIndex: number, toIndex: number) => void;
    goHome: () => void;
    favorites: string[];
    toggleFavorite: (slug: string) => void;
    isFavorite: (slug: string) => boolean;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOME_TAB: Tab = {
    id: "home",
    title: "Home",
    toolSlug: null,
    category: null,
};

const MAX_TABS = 10;

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/** Derive the URL path for a tab */
function tabToPath(tab: Tab): string {
    if (!tab.toolSlug || !tab.category) return "/";
    if (tab.toolSlug.startsWith("__category__/")) {
        return categoryPath(tab.category);
    }
    return toolPath(tab.category, tab.toolSlug);
}

/** Parse the current pathname into { category, slug } or null for home */
function parsePathname(pathname: string): { category: string; slug: string } | null {
    // pathname like "/tools/developers/base64-encode"
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 3 && segments[0] === "tools") {
        return { category: segments[1], slug: segments[2] };
    }
    return null;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const TabContext = createContext<TabContextType | null>(null);

export function useTabContext(): TabContextType {
    const ctx = useContext(TabContext);
    if (!ctx) throw new Error("useTabContext must be used inside <TabProvider>");
    return ctx;
}

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = "toolich-tabs";

type StoredState = {
    tabs: Tab[];
    activeTabId: string;
    nextId: number;
    splitTabId?: string | null;
    splitRatio?: number;
};

function saveToSession(tabs: Tab[], activeTabId: string, splitTabId: string | null, splitRatio: number) {
    try {
        const state: StoredState = { tabs, activeTabId, nextId: nextTabId, splitTabId, splitRatio };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* quota exceeded — ignore */ }
}

function loadFromSession(): StoredState | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const state = JSON.parse(raw) as StoredState;
        if (!Array.isArray(state.tabs) || !state.activeTabId) return null;
        return state;
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

let nextTabId = 1;

export function TabProvider({ children }: { children: ReactNode }) {
    const [tabs, setTabs] = useState<Tab[]>([HOME_TAB]);
    const [activeTabId, setActiveTabId] = useState("home");
    const [splitTabId, setSplitTabId] = useState<string | null>(null);
    const [splitRatio, setSplitRatio] = useState(0.5);
    const [isWide, setIsWide] = useState(false);
    const tabsRef = useRef(tabs);
    tabsRef.current = tabs;
    const activeTabIdRef = useRef(activeTabId);
    activeTabIdRef.current = activeTabId;
    const splitTabIdRef = useRef(splitTabId);
    splitTabIdRef.current = splitTabId;
    // Prevent pushState during popstate handling
    const skipPushRef = useRef(false);

    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("toolich-favorites");
            if (raw) {
                setFavorites(JSON.parse(raw));
            }
        } catch (e) {
            console.error("Failed to load favorites", e);
        }
    }, []);

    const toggleFavorite = useCallback((slug: string) => {
        setFavorites((prev) => {
            const next = prev.includes(slug)
                ? prev.filter((s) => s !== slug)
                : [...prev, slug];
            try {
                localStorage.setItem("toolich-favorites", JSON.stringify(next));
            } catch (e) {
                console.error("Failed to save favorites", e);
            }
            return next;
        });
    }, []);

    const isFavorite = useCallback(
        (slug: string) => favorites.includes(slug),
        [favorites]
    );

    // ── Initialise: restore from session (soft reload) or from URL (hard reload / direct link) ──
    useEffect(() => {
        const saved = loadFromSession();
        if (saved && saved.tabs.length > 1) {
            // Soft reload — restore all tabs
            nextTabId = saved.nextId;
            setTabs(saved.tabs);
            setActiveTabId(saved.activeTabId);
            if (saved.splitTabId) setSplitTabId(saved.splitTabId);
            if (saved.splitRatio) setSplitRatio(saved.splitRatio);
            return;
        }

        // Hard reload or fresh visit — init from URL
        const parsed = parsePathname(window.location.pathname);
        if (parsed) {
            const meta = getToolBySlug(parsed.category, parsed.slug);
            if (meta) {
                const id = `tab-${nextTabId++}`;
                const newTab: Tab = {
                    id,
                    title: meta.name,
                    toolSlug: meta.slug,
                    category: meta.category,
                };
                setTabs([HOME_TAB, newTab]);
                setActiveTabId(id);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Persist tabs to sessionStorage on every change ──
    useEffect(() => {
        saveToSession(tabs, activeTabId, splitTabId, splitRatio);
    }, [tabs, activeTabId, splitTabId, splitRatio]);

    // ── Clear session on hard reload (Ctrl+Shift+R / Cmd+Shift+R) ──
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && (e.ctrlKey || e.metaKey) && e.key === "r") {
                sessionStorage.clear();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    // ── Sync URL when active tab changes ──
    useEffect(() => {
        if (skipPushRef.current) {
            skipPushRef.current = false;
            return;
        }
        const activeTab = tabs.find((t) => t.id === activeTabId);
        if (!activeTab) return;
        const targetPath = tabToPath(activeTab);
        if (window.location.pathname !== targetPath) {
            window.history.pushState({ tabId: activeTabId }, "", targetPath);
        }
    }, [activeTabId, tabs]);

    // ── Handle browser back/forward ──
    useEffect(() => {
        const onPopState = () => {
            const parsed = parsePathname(window.location.pathname);
            if (!parsed) {
                // Home
                skipPushRef.current = true;
                setActiveTabId("home");
                return;
            }
            // Find if we already have this tab open
            const existing = tabsRef.current.find(
                (t) => t.toolSlug === parsed.slug && t.category === parsed.category,
            );
            if (existing) {
                skipPushRef.current = true;
                setActiveTabId(existing.id);
            } else {
                // Open it as a new tab
                const meta = getToolBySlug(parsed.category, parsed.slug);
                if (meta) {
                    const id = `tab-${nextTabId++}`;
                    const newTab: Tab = {
                        id,
                        title: meta.name,
                        toolSlug: meta.slug,
                        category: meta.category,
                    };
                    skipPushRef.current = true;
                    setTabs((prev) => [...prev, newTab]);
                    setActiveTabId(id);
                }
            }
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    // ── Tab operations ──

    const openTab = useCallback(
        (tool: { name: string; slug: string; category: string }) => {
            const existing = tabsRef.current.find(
                (t) => t.toolSlug === tool.slug && t.category === tool.category,
            );
            if (existing) {
                setActiveTabId(existing.id);
                trackToolUsage({ name: tool.name, slug: tool.slug, category: tool.category });
                return;
            }
            if (tabsRef.current.length >= MAX_TABS) return false;
            const id = `tab-${nextTabId++}`;
            const newTab: Tab = {
                id,
                title: tool.name,
                toolSlug: tool.slug,
                category: tool.category,
            };
            setTabs((prev) => {
                if (prev.length >= MAX_TABS) return prev;
                return [...prev, newTab];
            });
            setActiveTabId(id);
            trackToolUsage({ name: tool.name, slug: tool.slug, category: tool.category });
        },
        [],
    );

    const openInCurrentTab = useCallback(
        (tool: { name: string; slug: string; category: string }) => {
            const current = tabsRef.current;
            const existing = current.find(
                (t) => t.toolSlug === tool.slug && t.category === tool.category,
            );
            if (existing) {
                setActiveTabId(existing.id);
                trackToolUsage({ name: tool.name, slug: tool.slug, category: tool.category });
                return;
            }

            if (activeTabIdRef.current === "home") {
                if (current.length >= MAX_TABS) return;
                const id = `tab-${nextTabId++}`;
                const newTab: Tab = {
                    id,
                    title: tool.name,
                    toolSlug: tool.slug,
                    category: tool.category,
                };
                setTabs((prev) => [...prev, newTab]);
                setActiveTabId(id);
                trackToolUsage({ name: tool.name, slug: tool.slug, category: tool.category });
                return;
            }

            setTabs((prev) =>
                prev.map((t) =>
                    t.id === activeTabIdRef.current
                        ? {
                            ...t,
                            title: tool.name,
                            toolSlug: tool.slug,
                            category: tool.category,
                        }
                        : t,
                ),
            );
            trackToolUsage({ name: tool.name, slug: tool.slug, category: tool.category });
        },
        [],
    );

    const openCategoryInCurrentTab = useCallback(
        (category: string, title: string): boolean => {
            // Block empty categories (but always allow __all__)
            if (category !== "__all__") {
                const tools = getToolsByCategory(category);
                if (tools.length === 0) return false;
            }

            const slug = `__category__/${category}`;
            const current = tabsRef.current;

            const existing = current.find((t) => t.toolSlug === slug);
            if (existing) {
                setActiveTabId(existing.id);
                return true;
            }

            if (activeTabIdRef.current === "home") {
                // Replace home tab content with the category, keep title as Home
                setTabs((prev) =>
                    prev.map((t) =>
                        t.id === "home"
                            ? { ...t, toolSlug: slug, category }
                            : t,
                    ),
                );
                return true;
            }

            setTabs((prev) =>
                prev.map((t) =>
                    t.id === activeTabIdRef.current
                        ? { ...t, title, toolSlug: slug, category }
                        : t,
                ),
            );
            return true;
        },
        [],
    );

    const closeTab = useCallback(
        (id: string) => {
            if (id === "home") return;
            // Auto-unsplit if closing the split tab
            if (id === splitTabIdRef.current) {
                setSplitTabId(null);
            }
            const current = tabsRef.current;
            const idx = current.findIndex((t) => t.id === id);
            const next = current.filter((t) => t.id !== id);

            setTabs(next);

            if (id === activeTabIdRef.current) {
                const newActive =
                    next[Math.min(idx, next.length - 1)]?.id ?? "home";
                setActiveTabId(newActive);

                // If falling back to home from a different tab, reset home to default view
                if (newActive === "home") {
                    setTabs((prev) =>
                        prev.map((t) =>
                            t.id === "home"
                                ? { ...t, title: "Home", toolSlug: null, category: null }
                                : t,
                        ),
                    );
                }
            }
        },
        [],
    );

    const splitTab = useCallback((id: string) => {
        if (id === "home") return;
        setSplitTabId(id);
    }, []);

    const unsplit = useCallback(() => {
        setSplitTabId(null);
        setSplitRatio(0.5);
    }, []);

    const reorderTab = useCallback((fromIndex: number, toIndex: number) => {
        // Don't allow moving Home tab or moving to position 0
        if (fromIndex === 0 || toIndex === 0 || fromIndex === toIndex) return;
        setTabs((prev) => {
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    }, []);

    const switchTab = useCallback((id: string) => {
        setActiveTabId(id);
        // Reset home tab to default view when switching to it
        if (id === "home") {
            setTabs((prev) =>
                prev.map((t) =>
                    t.id === "home"
                        ? { ...t, title: "Home", toolSlug: null, category: null }
                        : t,
                ),
            );
        }
    }, []);

    const goHome = useCallback(() => {
        setTabs((prev) =>
            prev.map((t) =>
                t.id === "home"
                    ? { ...t, title: "Home", toolSlug: null, category: null }
                    : t,
            ),
        );
        setActiveTabId("home");
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem("toolich-wide");
        if (saved === "true") {
            setIsWide(true);
        }
    }, []);

    const toggleWide = useCallback(() => {
        setIsWide((prev) => {
            const next = !prev;
            localStorage.setItem("toolich-wide", String(next));
            return next;
        });
    }, []);

    return (
        <TabContext.Provider
            value={{
                tabs,
                activeTabId,
                splitTabId,
                splitRatio,
                maxTabs: MAX_TABS,
                isWide,
                toggleWide,
                openTab,
                openInCurrentTab,
                openCategoryInCurrentTab,
                closeTab,
                switchTab,
                splitTab,
                unsplit,
                setSplitRatio,
                reorderTab,
                goHome,
                favorites,
                toggleFavorite,
                isFavorite,
            }}
        >
            {children}
        </TabContext.Provider>
    );
}

