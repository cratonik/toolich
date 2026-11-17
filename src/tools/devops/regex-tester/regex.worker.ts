/* eslint-disable no-restricted-globals */
// Runs regex matching off the main thread so a catastrophic-backtracking
// pattern (e.g. /(a+)+$/ on "aaaa…b") can be killed with worker.terminate()
// instead of freezing the whole tab.

export type RegexJob = {
    id: number;
    pattern: string;
    flags: string;
    text: string;
    limit: number;
};

export type RegexMatch = {
    fullMatch: string;
    index: number;
    length: number;
    groups: string[];
};

export type RegexResult =
    | { id: number; matches: RegexMatch[]; truncated: boolean }
    | { id: number; error: string };

const toMatch = (m: RegExpMatchArray | RegExpExecArray): RegexMatch => ({
    fullMatch: m[0],
    index: m.index ?? 0,
    length: m[0].length,
    groups: m.slice(1).map((g) => g ?? ""),
});

self.onmessage = (event: MessageEvent<RegexJob>) => {
    const { id, pattern, flags, text, limit } = event.data;
    try {
        const re = new RegExp(pattern, flags);
        const matches: RegexMatch[] = [];
        let truncated = false;
        if (flags.includes("g")) {
            for (const m of text.matchAll(re)) {
                if (matches.length >= limit) {
                    truncated = true;
                    break;
                }
                matches.push(toMatch(m));
            }
        } else {
            const m = re.exec(text);
            if (m) matches.push(toMatch(m));
        }
        self.postMessage({ id, matches, truncated } satisfies RegexResult);
    } catch (err) {
        self.postMessage({
            id,
            error: err instanceof Error ? err.message : "Invalid regex",
        } satisfies RegexResult);
    }
};

export {};
