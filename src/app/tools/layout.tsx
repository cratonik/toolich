"use client";

import { TabBar } from "@/components/TabBar";
import { TabContent } from "@/components/TabContent";

export default function ToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Suppress the individual page content — the tab system handles rendering.
    // The children (page.tsx files) still provide metadata for SEO.
    void children;

    return (
        <div className="min-h-screen bg-zinc-50 pt-14 dark:bg-zinc-950">
            <TabBar />
            <TabContent />
        </div>
    );
}
