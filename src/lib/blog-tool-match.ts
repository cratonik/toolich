import type { ToolMetaWithPath } from "@/lib/tool-registry";

const STOP = new Set(["to", "and", "the", "a", "an", "&", "of", "for", "with", "your", "in", "on", "—", "-"]);

const tokens = (text: string) =>
    text
        .toLowerCase()
        .split(/[^a-z0-9+#]+/)
        .filter((t) => t.length > 1 && !STOP.has(t));

/** "formatter" ~ "format", "decoder" ~ "decode", "types" ~ "typescript" (shared stem of 4+ chars). */
function sameStem(a: string, b: string): boolean {
    if (a === b) return true;
    const n = Math.min(a.length, b.length);
    return n >= 4 && (a.startsWith(b) || b.startsWith(a));
}

/**
 * Pick the tool a blog post is about, from its title (tool-name words weigh
 * most) and SEO keywords. Returns null for general posts.
 */
export function findToolForBlog(
    blog: { title: string; keywords?: string },
    tools: ToolMetaWithPath[],
): ToolMetaWithPath | null {
    const titleTokens = tokens(blog.title);
    const keywordText = (blog.keywords ?? "").toLowerCase();
    let best: ToolMetaWithPath | null = null;
    let bestScore = 0;

    for (const tool of tools) {
        const nameTokens = tokens(tool.name);
        const nameHits = nameTokens.filter((n) => titleTokens.some((t) => sameStem(n, t))).length;
        if (nameHits === 0) continue;
        // Every word of the tool name present in the title is a strong signal.
        let score = nameHits * 3 + (nameHits === nameTokens.length ? 4 : 0);
        for (const kw of tool.keywords) {
            if (kw.length > 2 && keywordText.includes(kw.toLowerCase())) score += 0.5;
        }
        if (score > bestScore) {
            bestScore = score;
            best = tool;
        }
    }
    return bestScore >= 7 ? best : null;
}
