"use client";

import { TabBar } from "@/components/TabBar";
import { TabContent } from "@/components/TabContent";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 pt-14 dark:bg-zinc-950">
      <TabBar />
      <TabContent />
    </div>
  );
}
