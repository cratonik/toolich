// ---------------------------------------------------------------------------
// .env parser & serializer
// ---------------------------------------------------------------------------

export type EnvEntry = {
    /** Variable key (empty for comments/blanks) */
    key: string;
    /** Variable value */
    value: string;
    /** Inline or full-line comment text (without leading #) */
    comment: string;
    /** True when the entire line is a comment */
    isComment: boolean;
    /** True when the line is blank */
    isBlank: boolean;
};

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

/**
 * Parse a raw `.env` string into structured entries.
 *
 * Handles:
 * - `KEY=VALUE`
 * - Single / double quoted values (`KEY="hello world"`)
 * - `# full-line comments`
 * - Blank lines (preserved for round-trip fidelity)
 * - Inline comments after unquoted values (`KEY=val # note`)
 * - `export KEY=VALUE` prefix
 */
export function parseEnv(raw: string): EnvEntry[] {
    const lines = raw.split(/\r?\n/);
    return lines.map((line) => {
        const trimmed = line.trim();

        // Blank line
        if (trimmed === "") {
            return { key: "", value: "", comment: "", isComment: false, isBlank: true };
        }

        // Full-line comment
        if (trimmed.startsWith("#")) {
            return {
                key: "",
                value: "",
                comment: trimmed.slice(1).trim(),
                isComment: true,
                isBlank: false,
            };
        }

        // Strip optional `export ` prefix
        let rest = trimmed;
        if (/^export\s+/i.test(rest)) {
            rest = rest.replace(/^export\s+/i, "");
        }

        const eqIdx = rest.indexOf("=");
        if (eqIdx === -1) {
            // Treat as a key with no value
            return { key: rest, value: "", comment: "", isComment: false, isBlank: false };
        }

        const key = rest.slice(0, eqIdx).trim();
        let valPart = rest.slice(eqIdx + 1);
        let comment = "";

        // Quoted value?
        const quoteChar = valPart.trimStart().charAt(0);
        if (quoteChar === '"' || quoteChar === "'") {
            const startIdx = valPart.indexOf(quoteChar);
            const endIdx = valPart.indexOf(quoteChar, startIdx + 1);
            if (endIdx !== -1) {
                const afterQuote = valPart.slice(endIdx + 1).trim();
                if (afterQuote.startsWith("#")) {
                    comment = afterQuote.slice(1).trim();
                }
                valPart = valPart.slice(startIdx + 1, endIdx);
            } else {
                // Unterminated quote — take as-is
                valPart = valPart.trimStart().slice(1);
            }
        } else {
            // Unquoted — check for inline comment
            const hashIdx = valPart.indexOf(" #");
            if (hashIdx !== -1) {
                comment = valPart.slice(hashIdx + 2).trim();
                valPart = valPart.slice(0, hashIdx);
            }
            valPart = valPart.trim();
        }

        return { key, value: valPart, comment, isComment: false, isBlank: false };
    });
}

// ---------------------------------------------------------------------------
// Serialize
// ---------------------------------------------------------------------------

/** Serialize entries back to `.env` format */
export function serializeEnv(entries: EnvEntry[]): string {
    return entries
        .map((e) => {
            if (e.isBlank) return "";
            if (e.isComment) return `# ${e.comment}`;
            const needsQuote = /[\s#"']/.test(e.value);
            const val = needsQuote ? `"${e.value}"` : e.value;
            const inline = e.comment ? ` # ${e.comment}` : "";
            return `${e.key}=${val}${inline}`;
        })
        .join("\n");
}

/** Serialize key-value entries to JSON (ignores comments/blanks) */
export function serializeJSON(entries: EnvEntry[]): string {
    const obj: Record<string, string> = {};
    for (const e of entries) {
        if (e.isComment || e.isBlank || !e.key) continue;
        obj[e.key] = e.value;
    }
    return JSON.stringify(obj, null, 2);
}

/** Serialize key-value entries to YAML (ignores comments/blanks) */
export function serializeYAML(entries: EnvEntry[]): string {
    const lines: string[] = [];
    for (const e of entries) {
        if (e.isComment || e.isBlank || !e.key) continue;
        // Quote values that could be ambiguous in YAML
        const needsQuote =
            e.value === "" ||
            /^[\s]|[\s]$/.test(e.value) ||
            /[:{}\[\],&*?|>!'"%@`#]/.test(e.value) ||
            /^(true|false|yes|no|on|off|null|~)$/i.test(e.value) ||
            /^[\d.eE+-]+$/.test(e.value);
        const val = needsQuote ? `"${e.value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` : e.value;
        lines.push(`${e.key}: ${val}`);
    }
    return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

/** Return the set of keys that appear more than once */
export function findDuplicates(entries: EnvEntry[]): Set<string> {
    const counts = new Map<string, number>();
    for (const e of entries) {
        if (e.isComment || e.isBlank || !e.key) continue;
        counts.set(e.key, (counts.get(e.key) ?? 0) + 1);
    }
    const dupes = new Set<string>();
    for (const [key, count] of counts) {
        if (count > 1) dupes.add(key);
    }
    return dupes;
}
