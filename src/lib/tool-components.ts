"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * Registry of tool components loaded on-demand via next/dynamic.
 * Key: `<category>/<slug>` (e.g. "developers/base64-encode")
 *
 * Tools and their heavy dependencies (Monaco, TipTap, Mermaid, highlight.js, node-forge)
 * are code-split into separate chunks and only downloaded when the user opens the tool.
 */
const TOOL_COMPONENTS: Record<string, ComponentType> = {
    "developers/base64-encode": dynamic(() => import("@/tools/developers/base64-encode/Base64Encoder"), { ssr: false }),
    "developers/base64-decode": dynamic(() => import("@/tools/developers/base64-decode/Base64Decoder"), { ssr: false }),
    "developers/json-formatter": dynamic(() => import("@/tools/developers/json-formatter/JsonFormatter"), { ssr: false }),
    "developers/uuid-generator": dynamic(() => import("@/tools/developers/uuid-generator/UuidGenerator"), { ssr: false }),
    "developers/json-to-schema": dynamic(() => import("@/tools/developers/json-to-schema/JsonToSchema"), { ssr: false }),
    "developers/json-to-types": dynamic(() => import("@/tools/developers/json-to-types/JsonToTypes"), { ssr: false }),
    "developers/python-compiler": dynamic(() => import("@/tools/developers/python-compiler/PythonCompiler"), { ssr: false }),
    "security/hash-generator": dynamic(() => import("@/tools/security/hash-generator/HashGenerator"), { ssr: false }),
    "security/password-generator": dynamic(() => import("@/tools/security/password-generator/PasswordGenerator"), { ssr: false }),
    "security/jwt-decoder": dynamic(() => import("@/tools/security/jwt-decoder/JwtDecoder"), { ssr: false }),
    "security/ssl-decoder": dynamic(() => import("@/tools/security/ssl-decoder/SslDecoder"), { ssr: false }),
    "devops/cron-parser": dynamic(() => import("@/tools/devops/cron-parser/CronParser"), { ssr: false }),
    "devops/env-editor": dynamic(() => import("@/tools/devops/env-editor/EnvEditor"), { ssr: false }),
    "devops/yaml-formatter": dynamic(() => import("@/tools/devops/yaml-formatter/YamlFormatter"), { ssr: false }),
    "devops/regex-tester": dynamic(() => import("@/tools/devops/regex-tester/RegexTester"), { ssr: false }),
    "networking/subnet-calculator": dynamic(() => import("@/tools/networking/subnet-calculator/SubnetCalculator"), { ssr: false }),
    "networking/dns-lookup": dynamic(() => import("@/tools/networking/dns-lookup/DnsLookup"), { ssr: false }),
    "networking/http-status-codes": dynamic(() => import("@/tools/networking/http-status-codes/HttpStatusCodes"), { ssr: false }),
    "networking/ip-lookup": dynamic(() => import("@/tools/networking/ip-lookup/IpLookup"), { ssr: false }),
    "managers/diff-checker": dynamic(() => import("@/tools/managers/diff-checker/DiffChecker"), { ssr: false }),
    "managers/notepad": dynamic(() => import("@/tools/managers/notepad/Notepad"), { ssr: false }),
    "managers/notebook": dynamic(() => import("@/tools/managers/notebook/Notebook"), { ssr: false }),
    "managers/markdown-editor": dynamic(() => import("@/tools/managers/markdown-editor/MarkdownEditor"), { ssr: false }),
    "manager/markdown-editor": dynamic(() => import("@/tools/managers/markdown-editor/MarkdownEditor"), { ssr: false }),
    "managers/timestamp-converter": dynamic(() => import("@/tools/managers/timestamp-converter/TimestampConverter"), { ssr: false }),
};

/**
 * Get the component for a tool by category and slug.
 * Returns undefined if the tool hasn't been registered.
 */
export function getToolComponent(
    category: string,
    slug: string,
): ComponentType | undefined {
    return TOOL_COMPONENTS[`${category}/${slug}`];
}
