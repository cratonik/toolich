"use client";

import { Suspense } from "react";
import { useTabContext, type Tab } from "@/lib/tab-context";
import { getToolComponent } from "@/lib/tool-components";
import { getToolBySlug } from "@/lib/tool-registry";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import HomePanel from "@/components/HomePanel";
import CategoryPanel from "@/components/CategoryPanel";

function ToolLoadingFallback() {
    return (
        <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-500 dark:border-zinc-600 dark:border-t-indigo-400" />
        </div>
    );
}

function TabPanel({ tab }: { tab: Tab }) {
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

    return (
        <div>
            {meta && (
                <ToolPageHeader
                    toolName={meta.name}
                    description={meta.description}
                    category={meta.category}
                />
            )}
            <Suspense fallback={<ToolLoadingFallback />}>
                <Component />
            </Suspense>
        </div>
    );
}

export function TabContent() {
    const { tabs, activeTabId } = useTabContext();

    return (
        <div className="min-h-screen bg-zinc-50 px-4 pt-6 pb-10 dark:bg-zinc-950 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        style={{ display: tab.id === activeTabId ? "block" : "none" }}
                    >
                        <TabPanel tab={tab} />
                    </div>
                ))}
            </div>
        </div>
    );
}
