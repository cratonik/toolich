/**
 * Central tool registry for Toolich.
 *
 * Every tool registers its metadata here. This powers search, navigation,
 * breadcrumbs, and the homepage. When adding a new tool:
 *   1. Create the tool folder in src/tools/<category>/<slug>/
 *   2. Add its metadata to the TOOLS array below
 *   3. Create a thin page in src/app/tools/<category>/<slug>/page.tsx
 */

import { toolPath } from "./routes";

export type ToolMeta = {
    /** Display name, e.g. "Base64 Encode" */
    name: string;
    /** URL slug, e.g. "base64-encode" */
    slug: string;
    /** Short description shown on the tool page */
    description: string;
    /** Category slug, e.g. "developers" */
    category: string;
    /** Additional categories this tool should appear in */
    additionalCategories?: string[];
    /** Keywords for search */
    keywords: string[];
};

/** Computed tool metadata with derived path */
export type ToolMetaWithPath = ToolMeta & {
    /** Full route path, e.g. "/tools/developers/base64-encode" */
    path: string;
};

// ---------------------------------------------------------------------------
// TOOL REGISTRY — add new tools here
// ---------------------------------------------------------------------------

const TOOLS: ToolMeta[] = [
    {
        name: "Base64 Encode",
        slug: "base64-encode",
        description: "Encode text or files to Base64 format.",
        category: "developers",
        keywords: ["base64", "encode", "convert", "binary"],
    },
    {
        name: "Base64 Decode",
        slug: "base64-decode",
        description: "Decode Base64 strings back to plain text.",
        category: "developers",
        keywords: ["base64", "decode", "convert", "binary"],
    },
    {
        name: "JSON Formatter",
        slug: "json-formatter",
        description: "Format, prettify, and minify JSON with validation.",
        category: "developers",
        keywords: ["json", "format", "prettify", "minify", "validate", "beautify"],
    },
    {
        name: "UUID Generator",
        slug: "uuid-generator",
        description: "Generate universally unique identifiers (UUIDs) with support for v1, v4, and v7.",
        category: "developers",
        keywords: ["uuid", "guid", "unique", "identifier", "generate", "random", "v1", "v4", "v7"],
    },
    {
        name: "Hash Generator",
        slug: "hash-generator",
        description: "Generate cryptographic and non-cryptographic hashes from text input.",
        category: "security",
        additionalCategories: ["developers"],
        keywords: [
            "hash", "md5", "sha", "sha256", "sha512", "sha1", "sha3",
            "ripemd", "crc", "adler", "whirlpool", "ntlm", "checksum",
            "cryptography", "digest",
        ],
    },
    {
        name: "Cron Parser",
        slug: "cron-parser",
        description: "Parse and describe cron expressions in human-readable language, and build them interactively.",
        category: "devops",
        keywords: [
            "cron", "crontab", "schedule", "cron expression", "cron parser",
            "cron builder", "cron job", "timer", "periodic", "scheduler",
        ],
    },
    {
        name: "Subnet Calculator",
        slug: "subnet-calculator",
        description: "Calculate subnet details from an IP address and CIDR prefix or subnet mask.",
        category: "networking",
        keywords: [
            "subnet", "cidr", "ip", "ipv4", "network", "mask",
            "broadcast", "host", "calculator", "wildcard",
        ],
    },
    {
        name: "Diff Checker",
        slug: "diff-checker",
        description: "Compare two blocks of text side-by-side and highlight differences at line and character level.",
        category: "managers",
        keywords: [
            "diff", "compare", "text", "difference", "merge",
            "side-by-side", "unified", "patch", "changes",
        ],
    },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** All registered tools with computed paths */
export const allTools: ToolMetaWithPath[] = TOOLS.map((t) => ({
    ...t,
    path: toolPath(t.category, t.slug),
}));

/** Get tools by category (also checks additionalCategories) */
export function getToolsByCategory(category: string): ToolMetaWithPath[] {
    return allTools.filter(
        (t) => t.category === category || t.additionalCategories?.includes(category),
    );
}

/** Get a single tool by category + slug */
export function getToolBySlug(
    category: string,
    slug: string,
): ToolMetaWithPath | undefined {
    return allTools.find((t) => t.category === category && t.slug === slug);
}

/** Search tools by query (matches name, description, keywords) */
export function searchTools(query: string): ToolMetaWithPath[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return allTools.filter(
        (t) =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.keywords.some((k) => k.includes(q)),
    );
}
