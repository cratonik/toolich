"use client";

import { TabBar } from "@/components/TabBar";
import { TabContent } from "@/components/TabContent";

import { useTabContext } from "@/lib/tab-context";

export default function ToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Suppress the individual page content — the tab system handles rendering.
    // The children (page.tsx files) still provide metadata for SEO.
    void children;
    const { viewMode } = useTabContext();

    return (
        <div className={`min-h-screen bg-zinc-50 ${viewMode === "minified" ? "pt-11" : "pt-14"} dark:bg-zinc-950 transition-all duration-300`}>
            {viewMode === "normal" && <TabBar />}
            <TabContent />
        </div>
    );
}
