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
import { getToolBySlug } from "@/lib/tool-registry";
import { toolPath, categoryPath } from "@/lib/routes";

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
    openTab: (tool: { name: string; slug: string; category: string }) => void;
    openInCurrentTab: (tool: {
        name: string;
        slug: string;
        category: string;
    }) => void;
    openCategoryInCurrentTab: (category: string, title: string) => void;
    closeTab: (id: string) => void;
    switchTab: (id: string) => void;
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
// Provider
// ---------------------------------------------------------------------------

let nextTabId = 1;

export function TabProvider({ children }: { children: ReactNode }) {
    const [tabs, setTabs] = useState<Tab[]>([HOME_TAB]);
    const [activeTabId, setActiveTabId] = useState("home");
    const tabsRef = useRef(tabs);
    tabsRef.current = tabs;
    const activeTabIdRef = useRef(activeTabId);
    activeTabIdRef.current = activeTabId;
    // Prevent pushState during popstate handling
    const skipPushRef = useRef(false);

    // ── Initialise from URL on mount ──
    useEffect(() => {
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
                return;
            }
            const id = `tab-${nextTabId++}`;
            const newTab: Tab = {
                id,
                title: tool.name,
                toolSlug: tool.slug,
                category: tool.category,
            };
            setTabs((prev) => [...prev, newTab]);
            setActiveTabId(id);
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
                return;
            }

            if (activeTabIdRef.current === "home") {
                const id = `tab-${nextTabId++}`;
                const newTab: Tab = {
                    id,
                    title: tool.name,
                    toolSlug: tool.slug,
                    category: tool.category,
                };
                setTabs((prev) => [...prev, newTab]);
                setActiveTabId(id);
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
        },
        [],
    );

    const openCategoryInCurrentTab = useCallback(
        (category: string, title: string) => {
            const slug = `__category__/${category}`;
            const current = tabsRef.current;

            const existing = current.find((t) => t.toolSlug === slug);
            if (existing) {
                setActiveTabId(existing.id);
                return;
            }

            if (activeTabIdRef.current === "home") {
                const id = `tab-${nextTabId++}`;
                setTabs((prev) => [
                    ...prev,
                    { id, title, toolSlug: slug, category },
                ]);
                setActiveTabId(id);
                return;
            }

            setTabs((prev) =>
                prev.map((t) =>
                    t.id === activeTabIdRef.current
                        ? { ...t, title, toolSlug: slug, category }
                        : t,
                ),
            );
        },
        [],
    );

    const closeTab = useCallback(
        (id: string) => {
            if (id === "home") return;
            const current = tabsRef.current;
            const idx = current.findIndex((t) => t.id === id);
            const next = current.filter((t) => t.id !== id);

            setTabs(next);

            if (id === activeTabIdRef.current) {
                const newActive =
                    next[Math.min(idx, next.length - 1)]?.id ?? "home";
                setActiveTabId(newActive);
            }
        },
        [],
    );

    const switchTab = useCallback((id: string) => {
        setActiveTabId(id);
    }, []);

    return (
        <TabContext.Provider
            value={{
                tabs,
                activeTabId,
                openTab,
                openInCurrentTab,
                openCategoryInCurrentTab,
                closeTab,
                switchTab,
            }}
        >
            {children}
        </TabContext.Provider>
    );
}

