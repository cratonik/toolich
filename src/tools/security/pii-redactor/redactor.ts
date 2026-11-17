/**
 * PII / sensitive-data redaction engine. Pure functions, no I/O: everything
 * runs in the browser and nothing is sent anywhere.
 *
 * Each detector finds candidate spans with a regex and (where possible)
 * validates them with a checksum or structural rule to keep false positives
 * down. Overlapping candidates are resolved by detector priority (secrets
 * before contact data before generic numbers), then by length.
 */

export type DetectorId =
    | "privateKey"
    | "jwt"
    | "urlCredentials"
    | "apiKey"
    | "secret"
    | "email"
    | "card"
    | "iban"
    | "ssn"
    | "pan"
    | "aadhaar"
    | "ipv4"
    | "ipv6"
    | "mac"
    | "phone"
    | "custom";

export type DetectorGroup = "Secrets" | "Contact" | "Financial" | "Government IDs" | "Network" | "Custom";

export type RedactionStyle = "numbered" | "label" | "mask" | "block";

export type DetectorInfo = {
    id: DetectorId;
    label: string;
    /** Placeholder name, e.g. EMAIL → [EMAIL_1] */
    tag: string;
    group: DetectorGroup;
    example: string;
};

/** Display order (grouped for the UI). Overlap priority is DETECTION_PRIORITY below. */
export const DETECTORS: DetectorInfo[] = [
    { id: "privateKey", label: "Private keys", tag: "PRIVATE_KEY", group: "Secrets", example: "-----BEGIN PRIVATE KEY-----" },
    { id: "jwt", label: "JWTs", tag: "JWT", group: "Secrets", example: "eyJhbGciOi…" },
    { id: "urlCredentials", label: "Credentials in URLs", tag: "URL_CREDENTIALS", group: "Secrets", example: "https://user:pass@host" },
    { id: "apiKey", label: "API keys & tokens", tag: "API_KEY", group: "Secrets", example: "AKIA…, ghp_…, sk_live_…, Bearer …" },
    { id: "secret", label: "Passwords & secrets", tag: "SECRET", group: "Secrets", example: "password=…, \"token\": \"…\"" },
    { id: "email", label: "Email addresses", tag: "EMAIL", group: "Contact", example: "jane@example.com" },
    { id: "phone", label: "Phone numbers", tag: "PHONE", group: "Contact", example: "+1 415 555 0132" },
    { id: "card", label: "Card numbers", tag: "CARD", group: "Financial", example: "4242 4242 4242 4242" },
    { id: "iban", label: "IBANs", tag: "IBAN", group: "Financial", example: "GB82 WEST 1234 5698 7654 32" },
    { id: "ssn", label: "US SSN", tag: "SSN", group: "Government IDs", example: "123-45-6789" },
    { id: "pan", label: "India PAN", tag: "PAN", group: "Government IDs", example: "ABCPE1234F" },
    { id: "aadhaar", label: "India Aadhaar", tag: "AADHAAR", group: "Government IDs", example: "2345 6789 0123" },
    { id: "ipv4", label: "IPv4 addresses", tag: "IPV4", group: "Network", example: "192.168.1.10" },
    { id: "ipv6", label: "IPv6 addresses", tag: "IPV6", group: "Network", example: "2001:db8::1" },
    { id: "mac", label: "MAC addresses", tag: "MAC", group: "Network", example: "00:1A:2B:3C:4D:5E" },
    { id: "custom", label: "Custom terms", tag: "TERM", group: "Custom", example: "names, company, project" },
];

/**
 * Earlier wins when two detectors match overlapping text: specific, validated
 * patterns first; phone numbers (the loosest pattern) last, so a phone match
 * can never take part of a card, IBAN or Aadhaar number.
 */
const DETECTION_PRIORITY: DetectorId[] = [
    "privateKey", "jwt", "urlCredentials", "apiKey", "secret", "email", "custom",
    "card", "iban", "aadhaar", "ssn", "pan", "mac", "ipv6", "ipv4", "phone",
];
const PRIORITY = Object.fromEntries(DETECTION_PRIORITY.map((id, i) => [id, i])) as Record<DetectorId, number>;
export const DETECTOR_BY_ID: Record<DetectorId, DetectorInfo> = Object.fromEntries(DETECTORS.map((d) => [d.id, d])) as Record<DetectorId, DetectorInfo>;

type Candidate = { type: DetectorId; start: number; end: number };

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

const digitsOf = (s: string) => s.replace(/\D/g, "");

export function luhnValid(num: string): boolean {
    let sum = 0;
    let double = false;
    for (let i = num.length - 1; i >= 0; i--) {
        let d = num.charCodeAt(i) - 48;
        if (double) {
            d *= 2;
            if (d > 9) d -= 9;
        }
        sum += d;
        double = !double;
    }
    return sum % 10 === 0;
}

function looksLikeCard(digits: string): boolean {
    if (digits.length < 13 || digits.length > 19) return false;
    // Visa, Mastercard (51-55, 2221-2720), Amex, Discover/RuPay/UnionPay/Maestro, JCB, Diners
    if (!/^(4|5[1-5]|2[2-7]|3[47]|3[0689]|6|5[06-9])/.test(digits)) return false;
    if (/^(\d)\1+$/.test(digits)) return false; // 0000…, 4444…
    return luhnValid(digits);
}

function ibanValid(raw: string): boolean {
    const iban = raw.replace(/\s/g, "").toUpperCase();
    if (iban.length < 15 || iban.length > 34) return false;
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    let remainder = 0;
    for (const ch of rearranged) {
        const v = ch >= "A" && ch <= "Z" ? String(ch.charCodeAt(0) - 55) : ch;
        for (const d of v) remainder = (remainder * 10 + (d.charCodeAt(0) - 48)) % 97;
    }
    return remainder === 1;
}

// Verhoeff checksum (used by Aadhaar)
const V_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const V_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
export function verhoeffValid(num: string): boolean {
    let c = 0;
    const digits = num.split("").reverse();
    for (let i = 0; i < digits.length; i++) c = V_D[c][V_P[i % 8][Number(digits[i])]];
    return c === 0;
}

function phoneValid(match: string): boolean {
    const digits = digitsOf(match);
    const hasFormatting = /[+()\s.-]/.test(match);
    if (/^\d{4}[-./]\d{1,2}[-./]\d{1,2}/.test(match)) return false; // dates
    if (/^\d{1,2}[-./]\d{1,2}[-./]\d{2,4}$/.test(match)) return false; // dates
    if (/^(\d)\1+$/.test(digits)) return false;
    if (!hasFormatting) {
        // Bare digit runs are usually IDs or timestamps; accept only common phone shapes.
        return (
            (digits.length === 10 && /^[2-9]/.test(digits)) || // US / India national
            (digits.length === 11 && /^1[2-9]/.test(digits)) || // US with country code
            (digits.length === 12 && /^91[6-9]/.test(digits)) // India with country code
        );
    }
    return digits.length >= 10 && digits.length <= 15;
}

const NON_SECRET_VALUES = /^(null|none|undefined|true|false|\*+|x+|<[^>]*>|\$\{[^}]*\}|\[[A-Z_]+(?:_\d+)?\]|changeme)$/i;

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Add the `d` (match indices) flag at runtime. The project's TS target predates
 * it, but every browser Toolich supports has it (Chrome 90+, Safari 15+, Firefox 88+).
 */
function withIndices(re: RegExp): RegExp {
    return new RegExp(re.source, re.flags + "d");
}

type Rule = {
    type: DetectorId;
    re: RegExp;
    /** Capture group holding the sensitive part (default: whole match). Needs the `d` flag. */
    group?: number;
    valid?: (value: string) => boolean;
};

const RULES: Rule[] = [
    { type: "privateKey", re: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9]+ )*PRIVATE KEY-----/g },
    { type: "jwt", re: /\beyJ[A-Za-z0-9_-]{5,}\.eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g },
    // Only the "user:password" part of scheme://user:password@host
    { type: "urlCredentials", re: withIndices(/\b[a-z][a-z0-9+.-]*:\/\/([^\s:@/]+:[^\s@/]+)@/gi), group: 1 },
    {
        type: "apiKey",
        re: new RegExp(
            [
                "\\b(?:AKIA|ASIA)[0-9A-Z]{16}\\b", // AWS access key id
                "\\bgh[pousr]_[A-Za-z0-9]{36,}\\b", // GitHub tokens
                "\\bgithub_pat_[A-Za-z0-9_]{50,}\\b",
                "\\bxox[abprs]-[A-Za-z0-9-]{10,}", // Slack
                "\\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{16,}\\b", // Stripe
                "\\bAIza[0-9A-Za-z_-]{35}", // Google API key
                "\\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}", // OpenAI / Anthropic
                "\\bglpat-[A-Za-z0-9_-]{20,}", // GitLab
                "\\bnpm_[A-Za-z0-9]{36}\\b", // npm
                "\\bSG\\.[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,}", // SendGrid
            ].join("|"),
            "g",
        ),
    },
    // Bearer <token>: only the token
    { type: "apiKey", re: withIndices(/\bBearer\s+([A-Za-z0-9._~+/-]{16,}=*)/g), group: 1 },
    // password=…, "client_secret": "…", API_KEY: … (value only)
    {
        type: "secret",
        re: withIndices(/\b[A-Za-z0-9_.-]*(?:password|passwd|pwd|secret|token|api[_-]?key|apikey|access[_-]?key|private[_-]?key|auth[_-]?key|credentials?)["']?\s*[:=]\s*(["']?)([^\s"',;}{)]{3,})\1/gi),
        group: 2,
        valid: (v) => !NON_SECRET_VALUES.test(v),
    },
    { type: "email", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/g },
    { type: "card", re: /(?<![\d-])\d(?:[ -]?\d){12,18}(?![\d-])/g, valid: (v) => looksLikeCard(digitsOf(v)) },
    { type: "iban", re: /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]){11,30}\b/g, valid: ibanValid },
    { type: "ssn", re: /\b(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g },
    { type: "pan", re: /\b[A-Z]{3}[PCHFATBLJG][A-Z]\d{4}[A-Z]\b/g },
    { type: "aadhaar", re: /(?<![\d-])[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}(?![\d-])/g, valid: (v) => verhoeffValid(digitsOf(v)) },
    { type: "ipv4", re: /(?<![\d.])(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?![\d]|\.\d)/g },
    {
        type: "ipv6",
        re: /(?<![\w:])(?:(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}|(?:[0-9a-f]{1,4}:){1,7}:|(?:[0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}|(?:[0-9a-f]{1,4}:){1,5}(?::[0-9a-f]{1,4}){1,2}|(?:[0-9a-f]{1,4}:){1,4}(?::[0-9a-f]{1,4}){1,3}|(?:[0-9a-f]{1,4}:){1,3}(?::[0-9a-f]{1,4}){1,4}|(?:[0-9a-f]{1,4}:){1,2}(?::[0-9a-f]{1,4}){1,5}|[0-9a-f]{1,4}:(?::[0-9a-f]{1,4}){1,6}|::(?:[0-9a-f]{1,4}(?::[0-9a-f]{1,4}){0,6})?)(?![\w:])/gi,
        // Length ≥ 6 skips code like "a::b" and the loopback "::1".
        valid: (v) => v.length >= 6 && (v.includes("::") || v.split(":").length === 8),
    },
    { type: "mac", re: /\b(?:[0-9A-F]{2}([:-]))(?:[0-9A-F]{2}\1){4}[0-9A-F]{2}\b/gi },
    {
        type: "phone",
        // Must not start or stop inside a longer digit run (e.g. a 16-digit card).
        re: /(?<![\w+]|\d[\s.-])(?:\+\d{1,3}[\s.-]?)?(?:\(\d{1,4}\)[\s.-]?)?\d(?:[\s.-]?\d){6,14}(?![\w]|[\s.-]\d)/g,
        valid: phoneValid,
    },
];

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findCandidates(text: string, enabled: Set<DetectorId>, customTerms: string[]): Candidate[] {
    const out: Candidate[] = [];
    for (const rule of RULES) {
        if (!enabled.has(rule.type)) continue;
        rule.re.lastIndex = 0;
        for (const m of text.matchAll(rule.re)) {
            let start = m.index ?? 0;
            let end = start + m[0].length;
            let value = m[0];
            if (rule.group !== undefined) {
                const idx = (m as RegExpMatchArray & { indices?: [number, number][] }).indices?.[rule.group];
                if (!idx) continue;
                [start, end] = idx;
                value = text.slice(start, end);
            }
            if (end <= start) continue;
            if (rule.valid && !rule.valid(value)) continue;
            out.push({ type: rule.type, start, end });
        }
    }

    if (enabled.has("custom")) {
        for (const raw of customTerms) {
            const term = raw.trim();
            if (term.length < 2) continue;
            const wordish = /^\w/.test(term) && /\w$/.test(term);
            const re = new RegExp(wordish ? `\\b${escapeRegExp(term)}\\b` : escapeRegExp(term), "gi");
            for (const m of text.matchAll(re)) {
                out.push({ type: "custom", start: m.index ?? 0, end: (m.index ?? 0) + m[0].length });
            }
        }
    }
    return out;
}

/** Keep the highest-priority (then longest) candidate wherever spans overlap. */
function resolveOverlaps(candidates: Candidate[], textLength: number): Candidate[] {
    const sorted = [...candidates].sort(
        (a, b) => PRIORITY[a.type] - PRIORITY[b.type] || b.end - b.start - (a.end - a.start) || a.start - b.start,
    );
    const taken = new Uint8Array(textLength);
    const kept: Candidate[] = [];
    outer: for (const c of sorted) {
        for (let i = c.start; i < c.end; i++) if (taken[i]) continue outer;
        taken.fill(1, c.start, c.end);
        kept.push(c);
    }
    return kept.sort((a, b) => a.start - b.start);
}

// ---------------------------------------------------------------------------
// Replacement
// ---------------------------------------------------------------------------

function maskValue(type: DetectorId, value: string): string {
    const star = (n: number) => "*".repeat(Math.max(3, n));
    switch (type) {
        case "email": {
            const [user, domain = ""] = value.split("@");
            const dot = domain.lastIndexOf(".");
            const host = dot > 0 ? domain.slice(0, dot) : domain;
            const tld = dot > 0 ? domain.slice(dot) : "";
            return `${user[0] ?? ""}${star(user.length - 1)}@${host[0] ?? ""}${star(host.length - 1)}${tld}`;
        }
        case "card":
        case "aadhaar":
        case "iban": {
            // Keep the separators and the last 4 characters
            const total = value.replace(/[\s-]/g, "").length;
            let seen = 0;
            return value.replace(/[A-Za-z0-9]/g, (ch) => (++seen > total - 4 ? ch : "*"));
        }
        case "phone": {
            const total = digitsOf(value).length;
            let seen = 0;
            return value.replace(/\d/g, (d) => (++seen > total - 2 ? d : "*"));
        }
        case "ipv4":
            return value.replace(/^\d+\.\d+\.\d+/, "***.***.***");
        default:
            // Secrets, IDs, terms: show a little of the start only when long enough
            return value.length > 12 ? `${value.slice(0, 4)}${"*".repeat(8)}` : star(value.length);
    }
}

function normalizeForMapping(type: DetectorId, value: string): string {
    if (type === "email" || type === "custom" || type === "ipv6" || type === "mac") return value.toLowerCase();
    if (type === "card" || type === "phone" || type === "aadhaar") return digitsOf(value);
    if (type === "iban") return value.replace(/\s/g, "").toUpperCase();
    return value;
}

export type Finding = {
    type: DetectorId;
    start: number;
    end: number;
    original: string;
    replacement: string;
};

export type Segment = { text: string; type?: DetectorId };

export type RedactionResult = {
    output: string;
    findings: Finding[];
    counts: Partial<Record<DetectorId, number>>;
    /** placeholder → original (numbered style only) */
    mapping: Record<string, string>;
    /** Output split into plain and redacted parts, for highlighting */
    segments: Segment[];
};

export type RedactOptions = {
    enabled: DetectorId[];
    style: RedactionStyle;
    customTerms?: string[];
};

export function redact(text: string, { enabled, style, customTerms = [] }: RedactOptions): RedactionResult {
    const found = resolveOverlaps(findCandidates(text, new Set(enabled), customTerms), text.length);

    const counters: Partial<Record<DetectorId, number>> = {};
    const placeholderFor = new Map<string, string>();
    const mapping: Record<string, string> = {};
    const findings: Finding[] = [];
    const segments: Segment[] = [];
    const counts: Partial<Record<DetectorId, number>> = {};
    let out = "";
    let cursor = 0;

    for (const c of found) {
        const original = text.slice(c.start, c.end);
        const tag = DETECTOR_BY_ID[c.type].tag;
        let replacement: string;
        if (style === "numbered") {
            const key = `${c.type}\u0000${normalizeForMapping(c.type, original)}`;
            let ph = placeholderFor.get(key);
            if (!ph) {
                counters[c.type] = (counters[c.type] ?? 0) + 1;
                ph = `[${tag}_${counters[c.type]}]`;
                placeholderFor.set(key, ph);
                mapping[ph] = original;
            }
            replacement = ph;
        } else if (style === "label") {
            replacement = `[${tag}]`;
        } else if (style === "mask") {
            replacement = maskValue(c.type, original);
        } else {
            replacement = "████████";
        }

        if (c.start > cursor) segments.push({ text: text.slice(cursor, c.start) });
        segments.push({ text: replacement, type: c.type });
        out += text.slice(cursor, c.start) + replacement;
        cursor = c.end;
        counts[c.type] = (counts[c.type] ?? 0) + 1;
        findings.push({ type: c.type, start: c.start, end: c.end, original, replacement });
    }
    if (cursor < text.length) segments.push({ text: text.slice(cursor) });
    out += text.slice(cursor);

    return { output: out, findings, counts, mapping, segments };
}

/** Put original values back into text that contains numbered placeholders. */
export function restore(text: string, mapping: Record<string, string>): { output: string; restored: number } {
    let restored = 0;
    const output = text.replace(/\[[A-Z_]+_\d+\]/g, (ph) => {
        if (Object.prototype.hasOwnProperty.call(mapping, ph)) {
            restored++;
            return mapping[ph];
        }
        return ph;
    });
    return { output, restored };
}
