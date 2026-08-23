"use client";

import { TabBar } from "@/components/TabBar";
import { TabContent } from "@/components/TabContent";
import { useTabContext } from "@/lib/tab-context";

export default function Home() {
  const { viewMode } = useTabContext();
  return (
    <div className={`min-h-screen bg-zinc-50 ${viewMode === "minified" ? "pt-11" : "pt-14"} dark:bg-zinc-950 transition-all duration-300`}>
      {viewMode === "normal" && <TabBar />}
      <TabContent />
    </div>
  );
}
