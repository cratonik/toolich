"use client";

import type { ComponentType } from "react";
import Base64Encoder from "@/tools/developers/base64-encode/Base64Encoder";
import Base64Decoder from "@/tools/developers/base64-decode/Base64Decoder";
import JsonFormatter from "@/tools/developers/json-formatter/JsonFormatter";
import UuidGenerator from "@/tools/developers/uuid-generator/UuidGenerator";
import HashGenerator from "@/tools/security/hash-generator/HashGenerator";
import CronParser from "@/tools/devops/cron-parser/CronParser";
import SubnetCalculator from "@/tools/networking/subnet-calculator/SubnetCalculator";
import DiffChecker from "@/tools/managers/diff-checker/DiffChecker";

/**
 * Registry of tool components.
 * Key: `<category>/<slug>` (e.g. "developers/base64-encode")
 *
 * When adding a new tool, add an entry here alongside the tool-registry metadata.
 */
const TOOL_COMPONENTS: Record<string, ComponentType> = {
    "developers/base64-encode": Base64Encoder,
    "developers/base64-decode": Base64Decoder,
    "developers/json-formatter": JsonFormatter,
    "developers/uuid-generator": UuidGenerator,
    "security/hash-generator": HashGenerator,
    "devops/cron-parser": CronParser,
    "networking/subnet-calculator": SubnetCalculator,
    "managers/diff-checker": DiffChecker,
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
