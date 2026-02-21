"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    type ReactNode,
} from "react";

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
    // Ref mirrors tabs state so callbacks always see latest without stale closures
    const tabsRef = useRef(tabs);
    tabsRef.current = tabs;

    /**
     * Open a tool in a NEW tab.
     * If the tool is already open, focuses that tab instead.
     */
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

    /**
     * Open a tool in the CURRENT (active) tab, replacing its content.
     * Home tab is never replaced — opens a new tab instead.
     */
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

            // Don't replace Home tab — open new tab instead
            if (activeTabId === "home") {
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

            // Replace current tab content
            setTabs((prev) =>
                prev.map((t) =>
                    t.id === activeTabId
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
        [activeTabId],
    );

    /**
     * Open a category listing in the current tab.
     * Uses a special slug convention: `__category__/<category>`
     */
    const openCategoryInCurrentTab = useCallback(
        (category: string, title: string) => {
            const slug = `__category__/${category}`;
            const current = tabsRef.current;

            const existing = current.find((t) => t.toolSlug === slug);
            if (existing) {
                setActiveTabId(existing.id);
                return;
            }

            if (activeTabId === "home") {
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
                    t.id === activeTabId
                        ? { ...t, title, toolSlug: slug, category }
                        : t,
                ),
            );
        },
        [activeTabId],
    );

    /**
     * Close a tab. Cannot close Home.
     */
    const closeTab = useCallback(
        (id: string) => {
            if (id === "home") return;
            const current = tabsRef.current;
            const idx = current.findIndex((t) => t.id === id);
            const next = current.filter((t) => t.id !== id);

            setTabs(next);

            if (id === activeTabId) {
                const newActive =
                    next[Math.min(idx, next.length - 1)]?.id ?? "home";
                setActiveTabId(newActive);
            }
        },
        [activeTabId],
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

