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
import { toolPath, categoryPath, CATEGORY_LABELS } from "@/lib/routes";
import { trackToolUsage } from "@/lib/recent-tools";
import { usePathname } from "next/navigation";

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
    splitHighlightTrigger: number;
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

function isStaticPath(path: string): boolean {
    return path === "/terms" || path === "/privacy" || path === "/about" || path === "/contact";
}

/** Parse the current pathname into { category, slug } or null for home */
function parsePathname(pathname: string): { category: string; slug: string } | null {
    // pathname like "/tools/developers/base64-encode"
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 3 && segments[0] === "tools") {
        return { category: segments[1], slug: segments[2] };
    }
    if (segments.length === 2 && segments[0] === "tools") {
        return { category: segments[1], slug: `__category__/${segments[1]}` };
    }
    return null;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const TabContext = createContext<TabContextType | null>(null);

export const TabIdContext = createContext<string | null>(null);

/** Get clean display title with instance number if duplicate */
export function getTabDisplayTitle(tab: Tab, allTabs: Tab[]): string {
    if (!tab.toolSlug) return tab.title;
    const duplicates = allTabs.filter((t) => t.toolSlug === tab.toolSlug);
    if (duplicates.length > 1) {
        const dupIndex = duplicates.findIndex((t) => t.id === tab.id);
        return `${tab.title} #${dupIndex + 1}`;
    }
    return tab.title;
}

/** Get storage suffix for a tab */
export function getTabStorageSuffix(tab: Tab, allTabs: Tab[]): string {
    if (!tab.toolSlug) return "home";
    const toolTabs = allTabs.filter((t) => t.toolSlug === tab.toolSlug);
    const index = toolTabs.findIndex((t) => t.id === tab.id);
    const occurrence = index !== -1 ? index + 1 : 1;
    const cleanSlug = tab.toolSlug.replace(/[^a-zA-Z0-9-]/g, "-");
    return `${cleanSlug}-${occurrence}`;
}

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
    const pathname = usePathname();

    // ── Initialise state based on URL pathname (safe for SSR & initial client render) ──
    const initialParsed = parsePathname(pathname);
    let initialTabs = [HOME_TAB];
    let initialActiveTabId = "home";

    if (initialParsed) {
        const isCategory = initialParsed.slug.startsWith("__category__/");
        const categorySlug = isCategory ? initialParsed.slug.replace("__category__/", "") : initialParsed.category;

        if (isCategory) {
            const title = categorySlug === "__all__" ? "All Tools" : `${CATEGORY_LABELS[categorySlug] ?? categorySlug} Tools`;
            const id = "tab-1";
            const newTab: Tab = {
                id,
                title,
                toolSlug: initialParsed.slug,
                category: categorySlug,
            };
            initialTabs = [HOME_TAB, newTab];
            initialActiveTabId = id;
        } else {
            const meta = getToolBySlug(initialParsed.category, initialParsed.slug);
            if (meta) {
                const id = "tab-1";
                const newTab: Tab = {
                    id,
                    title: meta.name,
                    toolSlug: meta.slug,
                    category: meta.category,
                };
                initialTabs = [HOME_TAB, newTab];
                initialActiveTabId = id;
            }
        }
    }

    const [tabs, setTabs] = useState<Tab[]>(initialTabs);
    const [activeTabId, setActiveTabId] = useState(initialActiveTabId);
    const [splitTabId, setSplitTabId] = useState<string | null>(null);
    const [splitRatio, setSplitRatio] = useState(0.5);
    const [splitHighlightTrigger, setSplitHighlightTrigger] = useState(0);
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

    // ── Initialise: restore from session (soft reload) or align nextTabId ──
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

        // Hard reload or fresh visit — we already initialized tabs from URL during render.
        // We just need to make sure nextTabId is set correctly.
        if (initialParsed) {
            nextTabId = 2;
        } else {
            nextTabId = 1;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Persist tabs to sessionStorage on every change ──
    useEffect(() => {
        saveToSession(tabs, activeTabId, splitTabId, splitRatio);
    }, [tabs, activeTabId, splitTabId, splitRatio]);

    // ── Sync URL when active tab changes ──
    useEffect(() => {
        if (skipPushRef.current) {
            skipPushRef.current = false;
            return;
        }
        const path = window.location.pathname;
        if (isStaticPath(path)) return;

        const activeTab = tabs.find((t) => t.id === activeTabId);
        if (!activeTab) return;
        const targetPath = tabToPath(activeTab);
        if (path !== targetPath) {
            window.history.pushState({ tabId: activeTabId }, "", targetPath);
        }
    }, [activeTabId, tabs]);

    // ── Handle browser back/forward ──
    useEffect(() => {
        const onPopState = (e: PopStateEvent) => {
            const state = e.state as { tabId?: string } | null;
            const parsed = parsePathname(window.location.pathname);
            if (!parsed) {
                // Home
                skipPushRef.current = true;
                setTabs((prev) =>
                    prev.map((t) =>
                        t.id === "home"
                            ? { ...t, title: "Home", toolSlug: null, category: null }
                            : t
                    )
                );
                setActiveTabId("home");
                setSplitTabId(null);
                return;
            }

            const targetTabId = state?.tabId;
            const isCategory = parsed.slug.startsWith("__category__/");
            const categorySlug = isCategory ? parsed.slug.replace("__category__/", "") : parsed.category;

            // Find if target tab exists
            const tabExists = targetTabId ? tabsRef.current.some((t) => t.id === targetTabId) : false;

            if (tabExists && targetTabId) {
                // Update the existing tab's content
                skipPushRef.current = true;
                if (isCategory) {
                    const title = targetTabId === "home" ? "Home" : (categorySlug === "__all__" ? "All Tools" : `${CATEGORY_LABELS[categorySlug] ?? categorySlug} Tools`);
                    setTabs((prev) =>
                        prev.map((t) =>
                            t.id === targetTabId
                                ? { ...t, title, toolSlug: parsed.slug, category: categorySlug }
                                : t
                        )
                    );
                } else {
                    const meta = getToolBySlug(parsed.category, parsed.slug);
                    if (meta) {
                        setTabs((prev) =>
                            prev.map((t) =>
                                t.id === targetTabId
                                    ? { ...t, title: targetTabId === "home" ? "Home" : meta.name, toolSlug: meta.slug, category: meta.category }
                                    : t
                            )
                        );
                    }
                }
                setActiveTabId(targetTabId);
            } else {
                // Fallback: Find if we already have this tab open by slug/category
                const existing = tabsRef.current.find(
                    (t) => t.toolSlug === parsed.slug && t.category === parsed.category,
                );
                if (existing) {
                    skipPushRef.current = true;
                    setActiveTabId(existing.id);
                } else {
                    // Open as new tab
                    if (isCategory) {
                        const title = categorySlug === "__all__" ? "All Tools" : `${CATEGORY_LABELS[categorySlug] ?? categorySlug} Tools`;
                        const id = `tab-${nextTabId++}`;
                        const newTab: Tab = {
                            id,
                            title,
                            toolSlug: parsed.slug,
                            category: categorySlug,
                        };
                        skipPushRef.current = true;
                        setTabs((prev) => [...prev, newTab]);
                        setActiveTabId(id);
                    } else {
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
                }
            }
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    // ── Tab operations ──

    const openTab = useCallback(
        (tool: { name: string; slug: string; category: string }) => {
            if (typeof window !== "undefined" && isStaticPath(window.location.pathname)) {
                window.location.href = toolPath(tool.category, tool.slug);
                return;
            }
            // Always create a new tab instance if under the limit
            if (tabsRef.current.length < MAX_TABS) {
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

            // Fallback to switching to the first existing tab instance of the tool
            const existing = tabsRef.current.find(
                (t) => t.toolSlug === tool.slug && t.category === tool.category,
            );
            if (existing) {
                setActiveTabId(existing.id);
                trackToolUsage({ name: tool.name, slug: tool.slug, category: tool.category });
                return;
            }
            return false;
        },
        [],
    );

    const openInCurrentTab = useCallback(
        (tool: { name: string; slug: string; category: string }) => {
            if (typeof window !== "undefined" && isStaticPath(window.location.pathname)) {
                window.location.href = toolPath(tool.category, tool.slug);
                return;
            }
            const current = tabsRef.current;

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
            if (typeof window !== "undefined" && isStaticPath(window.location.pathname)) {
                window.location.href = categoryPath(category);
                return true;
            }
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
            // Auto-unsplit if closing the split tab or closing the active tab while split view is active
            if (id === splitTabIdRef.current || (splitTabIdRef.current !== null && id === activeTabIdRef.current)) {
                setSplitTabId(null);
            }
            const current = tabsRef.current;
            const tabToClose = current.find((t) => t.id === id);
            const idx = current.findIndex((t) => t.id === id);
            const next = current.filter((t) => t.id !== id);

            setTabs(next);

            // Clean up session storage and local storage keys for this tab
            if (tabToClose && tabToClose.toolSlug) {
                try {
                    const count = current.filter((t) => t.toolSlug === tabToClose.toolSlug).length;
                    const cleanSlug = tabToClose.toolSlug.replace(/[^a-zA-Z0-9-]/g, "-");
                    const suffix = `-${cleanSlug}-${count}`;
                    
                    // Session Storage
                    const sessionKeys: string[] = [];
                    for (let i = 0; i < sessionStorage.length; i++) {
                        const key = sessionStorage.key(i);
                        if (key && key.endsWith(suffix)) {
                            sessionKeys.push(key);
                        }
                    }
                    sessionKeys.forEach((key) => sessionStorage.removeItem(key));

                    // Local Storage
                    const localKeys: string[] = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.endsWith(suffix)) {
                            localKeys.push(key);
                        }
                    }
                    localKeys.forEach((key) => localStorage.removeItem(key));
                } catch (e) {
                    console.error("Failed to clean up storage for tab", e);
                }
            }

            if (id === activeTabIdRef.current) {
                const newActive =
                    next[Math.min(idx, next.length - 1)]?.id ?? "home";
                
                // If the new active tab matches the split tab, clear split view
                if (newActive === splitTabIdRef.current) {
                    setSplitTabId(null);
                }

                setActiveTabId(newActive);

                // If falling back to home from a different tab, reset home to default view
                if (newActive === "home") {
                    setSplitTabId(null);
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
        if (id === "home" || activeTabIdRef.current === "home") return;
        if (id === activeTabIdRef.current) return;
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
        if (id === splitTabIdRef.current) {
            setSplitHighlightTrigger((prev) => prev + 1);
            return;
        }
        setActiveTabId(id);
        // Reset home tab to default view when switching to it
        if (id === "home") {
            setSplitTabId(null);
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
        if (typeof window !== "undefined" && isStaticPath(window.location.pathname)) {
            window.location.href = "/";
            return;
        }
        setSplitTabId(null);
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
                splitHighlightTrigger,
            }}
        >
            {children}
        </TabContext.Provider>
    );
}

