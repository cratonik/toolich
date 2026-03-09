import type { ToolMeta } from "@/lib/tool-registry";

export const toolMeta: ToolMeta = {
    name: "Diff Checker",
    slug: "diff-checker",
    description: "Compare two blocks of text side-by-side and highlight differences at line and character level.",
    category: "managers",
    keywords: [
        "diff", "compare", "text", "difference", "merge",
        "side-by-side", "unified", "patch", "changes",
    ],
};
