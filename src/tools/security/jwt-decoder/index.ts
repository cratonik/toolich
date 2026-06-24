import type { ToolMeta } from "@/lib/tool-registry";

export const toolMeta: ToolMeta = {
    name: "JWT Decoder",
    slug: "jwt-decoder",
    description: "Decode, inspect, and verify JSON Web Tokens (JWT) client-side.",
    category: "security",
    additionalCategories: ["developers"],
    keywords: [
        "jwt", "token", "decoder", "inspect", "base64url",
        "security", "json web token", "claims", "header", "payload",
    ],
};
