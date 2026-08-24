import type { ToolMeta } from "@/lib/tool-registry";

export const toolMeta: ToolMeta = {
    name: "HTTP Status Codes",
    slug: "http-status-codes",
    description: "Searchable reference for all HTTP status codes with descriptions and examples.",
    category: "networking",
    additionalCategories: ["developers"],
    keywords: [
        "http", "status", "code", "reference", "api", "network", "200", "404", "500",
    ],
};
