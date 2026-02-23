"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * Registry of lazily-loaded tool components.
 * Key: `<category>/<slug>` (e.g. "developers/base64-encode")
 *
 * When adding a new tool, add an entry here alongside the tool-registry metadata.
 */
const TOOL_COMPONENTS: Record<string, ComponentType> = {
    "developers/base64-encode": dynamic(
        () => import("@/tools/developers/base64-encode/Base64Encoder"),
        { ssr: false },
    ),
    "developers/base64-decode": dynamic(
        () => import("@/tools/developers/base64-decode/Base64Decoder"),
        { ssr: false },
    ),
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
