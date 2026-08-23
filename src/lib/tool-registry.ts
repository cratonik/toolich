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
        name: "JSON to Schema",
        slug: "json-to-schema",
        description:
            "Infer a JSON Schema (draft-07) from any JSON object or array input.",
        category: "developers",
        keywords: [
            "json", "schema", "json schema", "json to schema",
            "infer", "generate", "draft-07", "validator",
            "convert", "structure", "type",
        ],
    },
    {
        name: "JSON Formatter",
        slug: "json-formatter",
        description: "Format, prettify, and minify JSON with validation.",
        category: "developers",
        keywords: ["json", "format", "prettify", "minify", "validate", "beautify"],
    },
    {
        name: "Python Compiler",
        slug: "python-compiler",
        description: "Write and execute Python 3 code entirely in your browser using Pyodide.",
        category: "developers",
        keywords: ["python", "compiler", "runner", "interpreter", "pyodide", "wasm", "webassembly", "code", "execute", "repl"],
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
        name: "Password Generator",
        slug: "password-generator",
        description:
            "Generate strong, random passwords with configurable length, character sets, and strength analysis.",
        category: "security",
        keywords: [
            "password", "generator", "random", "strong", "secure",
            "entropy", "passphrase", "credential", "security",
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
        name: "SSL Certificate Decoder",
        slug: "ssl-decoder",
        description: "Decode PEM formatted X.509 SSL/TLS certificates to view details like subject, issuer, validity, and extensions.",
        category: "security",
        keywords: [
            "ssl", "tls", "certificate", "decode", "x509", "pem", "crt", "cer", "cert",
            "subject", "issuer", "validity", "san", "public key"
        ],
    },
    {
        name: "Environment Variable Editor",
        slug: "env-editor",
        description:
            "Parse, edit, and manage .env files with a structured key-value editor and export to multiple formats.",
        category: "devops",
        keywords: [
            "env", "dotenv", ".env", "environment", "variable",
            "editor", "key-value", "config", "configuration",
            "json", "yaml", "export",
        ],
    },
    {
        name: "Regex Tester",
        slug: "regex-tester",
        description:
            "Test regular expressions with real-time match highlighting and generate patterns from natural language.",
        category: "devops",
        keywords: [
            "regex", "regexp", "regular expression", "pattern",
            "match", "test", "replace", "capture", "group",
            "generator", "validate",
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
    {
        name: "Notepad",
        slug: "notepad",
        description: "A simple, persistent notepad with word and character count.",
        category: "managers",
        keywords: [
            "notepad", "notes", "text editor", "scratchpad", "draft", "write"
        ],
    },
    {
        name: "Notebook",
        slug: "notebook",
        description: "A structured, long-term personal knowledge with persistent local storage.",
        category: "managers",
        keywords: [
            "notebook", "notes", "markdown", "knowledge base", "journal", "organizer", "persistent notes"
        ],
    },
    {
        name: "DNS Lookup",
        slug: "dns-lookup",
        description: "Query DNS records for any domain name, displaying A, AAAA, CNAME, MX, TXT, NS, and SOA records.",
        category: "networking",
        keywords: [
            "dns", "lookup", "resolver", "domain", "records",
            "a", "aaaa", "cname", "mx", "txt", "ns", "soa",
            "ttl", "network", "networking",
        ],
    },
    {
        name: "Markdown Editor",
        slug: "markdown-editor",
        description: "Write and preview Markdown in a split-pane editor with live rendering.",
        category: "managers",
        keywords: [
            "markdown", "editor", "preview", "gfm", "commonmark", "writer",
            "wysiwyg", "mermaid", "diagram", "graph", "chart",
        ],
    },
    {
        name: "JSON to Types",
        slug: "json-to-types",
        description: "Generate TypeScript interfaces and Python type declarations from JSON payloads.",
        category: "developers",
        keywords: [
            "json", "typescript", "python", "types", "interface",
            "pydantic", "generator", "converter", "model",
        ],
    },
    {
        name: "JWT Decoder",
        slug: "jwt-decoder",
        description: "Decode, inspect, and verify JSON Web Tokens (JWT) client-side.",
        category: "security",
        additionalCategories: ["developers"],
        keywords: [
            "jwt", "token", "decoder", "inspect", "base64url",
            "security", "json web token", "claims", "header", "payload",
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
    const normCategory = category === "manager" ? "managers" : category;
    return allTools.find((t) => t.category === normCategory && t.slug === slug);
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
