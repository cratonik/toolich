import type { ToolMeta } from "@/lib/tool-registry";

export const toolMeta: ToolMeta = {
    name: "PII Redactor",
    slug: "pii-redactor",
    description:
        "Hide emails, phone numbers, card numbers, IPs, API keys and other sensitive data in logs or text before sharing — entirely in your browser.",
    category: "security",
    keywords: [
        "pii", "redact", "redactor", "mask", "anonymize", "sanitize", "sensitive data",
        "personal data", "gdpr", "data masking", "log scrubber", "secrets", "api key",
        "email", "phone", "credit card",
    ],
};
