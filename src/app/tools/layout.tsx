"use client";

import { TabBar } from "@/components/TabBar";
import { TabContent } from "@/components/TabContent";

import { useTabContext } from "@/lib/tab-context";

export default function ToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // The tab system renders the visible UI. Pages under /tools render only
    // JSON-LD <script> tags (no visible output), so they are passed through to
    // land in the server HTML where crawlers can read them.
    const { viewMode } = useTabContext();

    return (
        <div className={`min-h-screen bg-zinc-50 ${viewMode === "minified" ? "pt-11" : "pt-14"} dark:bg-zinc-950 transition-all duration-300`}>
            {children}
            {viewMode === "normal" && <TabBar />}
            <TabContent />
        </div>
    );
}
