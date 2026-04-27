import type { ToolMeta } from "@/lib/tool-registry";

export const toolMeta: ToolMeta = {
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
};
