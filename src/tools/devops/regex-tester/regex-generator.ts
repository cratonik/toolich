// ---------------------------------------------------------------------------
// Rule-based regex generator from natural language descriptions
// ---------------------------------------------------------------------------

export type GeneratedPattern = {
    /** The regex pattern string (without delimiters) */
    regex: string;
    /** Suggested flags */
    flags: string;
    /** Human-readable name of the pattern */
    name: string;
    /** Line-by-line explanation of each regex part */
    explanation: string[];
};

type PatternEntry = {
    keywords: string[];
    name: string;
    regex: string;
    flags: string;
    explanation: string[];
};

// ---------------------------------------------------------------------------
// Built-in patterns
// ---------------------------------------------------------------------------

const PATTERNS: PatternEntry[] = [
    {
        keywords: ["email", "mail", "e-mail"],
        name: "Email Address",
        regex: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
        flags: "gi",
        explanation: [
            "[a-zA-Z0-9._%+-]+  →  one or more valid username characters",
            "@                  →  literal @ symbol",
            "[a-zA-Z0-9.-]+     →  domain name (letters, digits, dots, hyphens)",
            "\\.[a-zA-Z]{2,}    →  dot followed by 2+ letter TLD",
        ],
    },
    {
        keywords: ["url", "link", "website", "http", "https", "web address"],
        name: "URL",
        regex: "https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]+",
        flags: "gi",
        explanation: [
            "https?             →  http or https",
            ":\\/\\/             →  ://",
            "[\\w\\-._~:/?#...] →  valid URL characters (path, query, fragment)",
        ],
    },
    {
        keywords: ["phone us", "us phone", "american phone", "us telephone"],
        name: "Phone Number (US)",
        regex: "(?:\\+?1[-\\s.]?)?\\(?\\d{3}\\)?[-\\s.]?\\d{3}[-\\s.]?\\d{4}\\b",
        flags: "g",
        explanation: [
            "(?:\\+?1[-\\s.]?)?  →  optional country code +1",
            "\\(?\\d{3}\\)?     →  3-digit area code with optional parentheses",
            "[-\\s.]?           →  optional separator (dash, space, dot)",
            "\\d{3}[-\\s.]?\\d{4} →  7-digit number (3 + 4) with optional separator",
            "\\b               →  word boundary (ensures exact length)",
            "Total: 10 digits (US standard)",
        ],
    },
    {
        keywords: ["phone india", "indian phone", "india mobile", "indian mobile", "+91"],
        name: "Phone Number (India)",
        regex: "(?:\\+?91[-\\s.]?)?[6-9]\\d{9}\\b",
        flags: "g",
        explanation: [
            "(?:\\+?91[-\\s.]?)? →  optional country code +91",
            "[6-9]             →  first digit must be 6, 7, 8, or 9",
            "\\d{9}            →  remaining 9 digits",
            "\\b               →  word boundary (ensures exact 10-digit length)",
            "Total: 10 digits (Indian standard)",
        ],
    },
    {
        keywords: ["phone uk", "uk phone", "british phone", "uk mobile", "+44"],
        name: "Phone Number (UK)",
        regex: "(?:\\+?44[-\\s.]?)?(?:0[-\\s.]?)?(?:\\d[-\\s.]?){10}\\b",
        flags: "g",
        explanation: [
            "(?:\\+?44[-\\s.]?)? →  optional country code +44",
            "(?:0[-\\s.]?)?     →  optional leading 0 (trunk prefix)",
            "(?:\\d[-\\s.]?){10} →  10 digits with optional separators",
            "\\b               →  word boundary",
            "Total: 10–11 digits (UK standard)",
        ],
    },
    {
        keywords: ["phone international", "e.164", "international phone", "e164"],
        name: "Phone Number (International E.164)",
        regex: "\\+[1-9]\\d{6,14}\\b",
        flags: "g",
        explanation: [
            "\\+               →  literal plus sign (required for E.164)",
            "[1-9]             →  country code starts with non-zero digit",
            "\\d{6,14}         →  6 to 14 more digits (total 7–15 digits)",
            "\\b               →  word boundary",
            "Matches any valid international phone number in E.164 format",
        ],
    },
    {
        keywords: ["phone", "telephone", "tel", "mobile", "cell", "phone number"],
        name: "Phone Number (General)",
        regex: "(?:\\+?\\d{1,3}[-\\s.]?)?\\(?\\d{2,4}\\)?[-\\s.]?\\d{3,4}[-\\s.]?\\d{3,4}\\b",
        flags: "g",
        explanation: [
            "(?:\\+?\\d{1,3}[-\\s.]?)? →  optional country code (1–3 digits)",
            "\\(?\\d{2,4}\\)?        →  area/city code (2–4 digits, optional parens)",
            "[-\\s.]?               →  optional separator",
            "\\d{3,4}[-\\s.]?\\d{3,4} →  subscriber number (6–8 digits)",
            "\\b                    →  word boundary",
            "Matches most common phone formats (7–15 digits total)",
        ],
    },
    {
        keywords: ["ipv4", "ip address", "ip"],
        name: "IPv4 Address",
        regex: "\\b(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b",
        flags: "g",
        explanation: [
            "\\b               →  word boundary",
            "25[0-5]           →  250–255",
            "2[0-4]\\d         →  200–249",
            "[01]?\\d\\d?      →  0–199",
            "\\.               →  literal dot separator (×3)",
            "Repeated 4 times for each octet",
        ],
    },
    {
        keywords: ["date", "yyyy-mm-dd", "iso date"],
        name: "Date (YYYY-MM-DD)",
        regex: "\\d{4}[-/](?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12]\\d|3[01])",
        flags: "g",
        explanation: [
            "\\d{4}            →  4-digit year",
            "[-/]              →  dash or slash separator",
            "(?:0[1-9]|1[0-2]) →  month 01–12",
            "[-/]              →  separator",
            "(?:0[1-9]|[12]\\d|3[01]) →  day 01–31",
        ],
    },
    {
        keywords: ["time", "hh:mm", "clock", "24 hour", "12 hour"],
        name: "Time (HH:MM or HH:MM:SS)",
        regex: "(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?",
        flags: "g",
        explanation: [
            "(?:[01]\\d|2[0-3]) →  hours 00–23",
            ":[0-5]\\d          →  :minutes 00–59",
            "(?::[0-5]\\d)?     →  optional :seconds",
        ],
    },
    {
        keywords: ["uuid", "guid"],
        name: "UUID (v4)",
        regex: "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}",
        flags: "gi",
        explanation: [
            "[0-9a-f]{8}       →  8 hex chars",
            "-[0-9a-f]{4}      →  -4 hex chars",
            "-4[0-9a-f]{3}     →  version 4 indicator + 3 hex chars",
            "-[89ab][0-9a-f]{3} →  variant bits + 3 hex chars",
            "-[0-9a-f]{12}     →  12 hex chars",
        ],
    },
    {
        keywords: ["hex", "hex color", "color code", "colour"],
        name: "Hex Color Code",
        regex: "#(?:[0-9a-fA-F]{3}){1,2}\\b",
        flags: "g",
        explanation: [
            "#                 →  literal hash",
            "(?:[0-9a-fA-F]{3}) →  3 hex digits",
            "{1,2}             →  match once (shorthand #RGB) or twice (#RRGGBB)",
            "\\b               →  word boundary",
        ],
    },
    {
        keywords: ["number", "integer", "digit", "numeric"],
        name: "Integer (with optional sign)",
        regex: "-?\\d+",
        flags: "g",
        explanation: [
            "-?    →  optional negative sign",
            "\\d+  →  one or more digits",
        ],
    },
    {
        keywords: ["decimal", "float", "floating point"],
        name: "Decimal / Float",
        regex: "-?\\d+\\.\\d+",
        flags: "g",
        explanation: [
            "-?     →  optional negative sign",
            "\\d+   →  integer part",
            "\\.    →  decimal point",
            "\\d+   →  fractional part",
        ],
    },
    {
        keywords: ["word", "words", "alphabetic", "alpha"],
        name: "Word (letters only)",
        regex: "[a-zA-Z]+",
        flags: "g",
        explanation: [
            "[a-zA-Z]+  →  one or more letters (upper or lower case)",
        ],
    },
    {
        keywords: ["username", "user name", "handle"],
        name: "Username (alphanumeric + underscore)",
        regex: "[a-zA-Z][a-zA-Z0-9_]{2,29}",
        flags: "g",
        explanation: [
            "[a-zA-Z]        →  starts with a letter",
            "[a-zA-Z0-9_]{2,29} →  followed by 2–29 alphanumeric or underscore chars",
            "Total length: 3–30 characters",
        ],
    },
    {
        keywords: ["password", "strong password"],
        name: "Strong Password",
        regex: "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}",
        flags: "",
        explanation: [
            "(?=.*[a-z])       →  at least one lowercase letter",
            "(?=.*[A-Z])       →  at least one uppercase letter",
            "(?=.*\\d)         →  at least one digit",
            "(?=.*[@$!%*?&])   →  at least one special character",
            "[A-Za-z\\d@$!%*?&]{8,} →  8 or more valid characters",
        ],
    },
    {
        keywords: ["credit card", "card number", "cc"],
        name: "Credit Card Number",
        regex: "\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b",
        flags: "g",
        explanation: [
            "\\b                →  word boundary",
            "(?:\\d{4}[-\\s]?)  →  4 digits + optional separator",
            "{3}               →  repeated 3 times",
            "\\d{4}            →  final 4 digits",
        ],
    },
    {
        keywords: ["zip", "zip code", "postal", "postal code"],
        name: "US ZIP Code",
        regex: "\\b\\d{5}(?:-\\d{4})?\\b",
        flags: "g",
        explanation: [
            "\\b       →  word boundary",
            "\\d{5}    →  5-digit ZIP",
            "(?:-\\d{4})? →  optional +4 extension",
        ],
    },
    {
        keywords: ["mac", "mac address"],
        name: "MAC Address",
        regex: "(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}",
        flags: "g",
        explanation: [
            "(?:[0-9A-Fa-f]{2}[:-]) →  two hex chars + separator",
            "{5}                     →  repeated 5 times",
            "[0-9A-Fa-f]{2}         →  final two hex chars",
        ],
    },
    {
        keywords: ["html", "tag", "html tag"],
        name: "HTML Tag",
        regex: "<\\/?[a-zA-Z][a-zA-Z0-9]*[^>]*>",
        flags: "g",
        explanation: [
            "<             →  opening angle bracket",
            "\\/?          →  optional closing slash",
            "[a-zA-Z]      →  tag name starts with letter",
            "[a-zA-Z0-9]*  →  rest of tag name",
            "[^>]*         →  any attributes",
            ">             →  closing angle bracket",
        ],
    },
    {
        keywords: ["whitespace", "spaces", "blank"],
        name: "Whitespace Sequence",
        regex: "\\s+",
        flags: "g",
        explanation: [
            "\\s+  →  one or more whitespace characters (spaces, tabs, newlines)",
        ],
    },
    {
        keywords: ["newline", "line break", "eol", "end of line"],
        name: "Line Break",
        regex: "\\r?\\n",
        flags: "g",
        explanation: [
            "\\r?  →  optional carriage return (Windows)",
            "\\n   →  newline character",
        ],
    },
    {
        keywords: ["slug", "url slug", "kebab"],
        name: "URL Slug",
        regex: "[a-z0-9]+(?:-[a-z0-9]+)*",
        flags: "g",
        explanation: [
            "[a-z0-9]+          →  one or more lowercase alphanumeric chars",
            "(?:-[a-z0-9]+)*    →  optionally followed by dash + more chars",
        ],
    },
    {
        keywords: ["domain", "domain name", "hostname"],
        name: "Domain Name",
        regex: "(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}",
        flags: "g",
        explanation: [
            "(?:[a-zA-Z0-9-]+\\.)+ →  one or more subdomains ending with dot",
            "[a-zA-Z]{2,}          →  TLD (2+ letters)",
        ],
    },
    {
        keywords: ["ssn", "social security"],
        name: "US Social Security Number",
        regex: "\\b\\d{3}-\\d{2}-\\d{4}\\b",
        flags: "g",
        explanation: [
            "\\d{3}  →  area number (3 digits)",
            "-       →  dash separator",
            "\\d{2}  →  group number (2 digits)",
            "-       →  dash separator",
            "\\d{4}  →  serial number (4 digits)",
        ],
    },
    {
        keywords: ["json", "json key", "json string"],
        name: "JSON String Value",
        regex: '"(?:[^"\\\\]|\\\\.)*"',
        flags: "g",
        explanation: [
            '\"              →  opening double quote',
            '(?:[^"\\\\]     →  any character except quote or backslash',
            '|\\\\.)*        →  OR an escaped character, repeated',
            '\"              →  closing double quote',
        ],
    },
    {
        keywords: ["csv", "comma separated"],
        name: "CSV Field",
        regex: '(?:^|,)("(?:[^"]|"")*"|[^,]*)',
        flags: "gm",
        explanation: [
            "(?:^|,)           →  start of line or comma",
            '"(?:[^"]|"")*"    →  quoted field (supports escaped quotes)',
            "|[^,]*            →  OR unquoted field",
        ],
    },
    {
        keywords: ["markdown", "md link", "markdown link"],
        name: "Markdown Link",
        regex: "\\[([^\\]]+)\\]\\(([^)]+)\\)",
        flags: "g",
        explanation: [
            "\\[([^\\]]+)\\]  →  [link text] (captured in group 1)",
            "\\(([^)]+)\\)    →  (url) (captured in group 2)",
        ],
    },
    {
        keywords: ["hashtag", "hash tag", "twitter"],
        name: "Hashtag",
        regex: "#[a-zA-Z_]\\w*",
        flags: "g",
        explanation: [
            "#           →  literal hash",
            "[a-zA-Z_]   →  must start with letter or underscore",
            "\\w*        →  followed by word characters",
        ],
    },
    {
        keywords: ["mention", "at mention", "@"],
        name: "@Mention",
        regex: "@[a-zA-Z_]\\w{0,29}",
        flags: "g",
        explanation: [
            "@            →  literal @",
            "[a-zA-Z_]    →  starts with letter or underscore",
            "\\w{0,29}    →  up to 29 more word characters",
        ],
    },
    {
        keywords: ["semver", "version", "semantic version"],
        name: "Semantic Version",
        regex: "\\bv?\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?(?:\\+[\\w.]+)?\\b",
        flags: "g",
        explanation: [
            "v?             →  optional 'v' prefix",
            "\\d+\\.\\d+\\.\\d+ →  major.minor.patch",
            "(?:-[\\w.]+)?  →  optional pre-release tag",
            "(?:\\+[\\w.]+)? →  optional build metadata",
        ],
    },
    {
        keywords: ["base64", "b64"],
        name: "Base64 String",
        regex: "(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?",
        flags: "g",
        explanation: [
            "(?:[A-Za-z0-9+/]{4})* →  groups of 4 Base64 characters",
            "(?:...==|...=)?       →  optional padding (2 chars + == or 3 chars + =)",
        ],
    },
    {
        keywords: ["jwt", "json web token", "bearer"],
        name: "JWT Token",
        regex: "eyJ[A-Za-z0-9_-]+\\.eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+",
        flags: "g",
        explanation: [
            "eyJ[A-Za-z0-9_-]+  →  Base64url-encoded header (starts with eyJ)",
            "\\.                 →  dot separator",
            "eyJ[A-Za-z0-9_-]+  →  Base64url-encoded payload",
            "\\.[A-Za-z0-9_-]+  →  dot + signature",
        ],
    },
];

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/** Generate a regex from a natural language description */
export function generateFromDescription(description: string): GeneratedPattern | null {
    const lower = description.toLowerCase().trim();
    if (!lower) return null;

    // Score each pattern by keyword matches
    let bestMatch: PatternEntry | null = null;
    let bestScore = 0;

    for (const pattern of PATTERNS) {
        let score = 0;
        for (const kw of pattern.keywords) {
            if (lower.includes(kw)) {
                // Longer keyword matches score higher
                score += kw.length;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = pattern;
        }
    }

    if (!bestMatch || bestScore === 0) return null;

    return {
        regex: bestMatch.regex,
        flags: bestMatch.flags,
        name: bestMatch.name,
        explanation: bestMatch.explanation,
    };
}

/** Get all available pattern names for listing */
export function getAllPatternNames(): string[] {
    return PATTERNS.map((p) => p.name);
}
