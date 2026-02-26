/**
 * Track recently used tools in localStorage.
 * Stores the last 8 tool slugs in order of most recent use.
 */

const STORAGE_KEY = "toolich-recent-tools";
const MAX_RECENT = 8;

export type RecentTool = {
    name: string;
    slug: string;
    category: string;
};

export function getRecentTools(): RecentTool[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as RecentTool[];
    } catch {
        return [];
    }
}

export function trackToolUsage(tool: RecentTool): void {
    try {
        const recent = getRecentTools();
        // Remove duplicates
        const filtered = recent.filter((t) => t.slug !== tool.slug);
        // Add to front
        filtered.unshift(tool);
        // Cap at max
        const capped = filtered.slice(0, MAX_RECENT);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
    } catch { /* storage full — ignore */ }
}
