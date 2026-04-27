"use client";

import { useState, useMemo, useCallback } from "react";
import {
    Copy,
    Check,
    Trash2,
    Columns2,
    AlignLeft,
    CaseSensitive,
    Space,
} from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";

// ── Diff algorithm ───────────────────────────────────────────────────────────

type DiffLineType = "added" | "removed" | "modified" | "unchanged";

type CharSpan = { text: string; highlight: boolean };

type DiffLine = {
    type: DiffLineType;
    /** Line from the original text (undefined for added lines) */
    oldLine?: string;
    oldLineNo?: number;
    /** Line from the modified text (undefined for removed lines) */
    newLine?: string;
    newLineNo?: number;
    /** Character-level spans for sub-highlighting in modified lines */
    oldSpans?: CharSpan[];
    newSpans?: CharSpan[];
};

type DiffOptions = {
    ignoreWhitespace: boolean;
    caseInsensitive: boolean;
};

/** Normalise a line based on diff options */
function normalizeLine(line: string, opts: DiffOptions): string {
    let s = line;
    if (opts.ignoreWhitespace) s = s.replace(/\s+/g, " ").trim();
    if (opts.caseInsensitive) s = s.toLowerCase();
    return s;
}

/**
 * Compute the LCS table between two arrays of strings.
 * Returns a 2D array of lengths.
 */
function lcsTable(a: string[], b: string[]): number[][] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
        new Array(n + 1).fill(0),
    );
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] =
                a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1] + 1
                    : Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    return dp;
}

/** Character-level sub-diff for a pair of modified lines */
function charDiff(oldStr: string, newStr: string): { oldSpans: CharSpan[]; newSpans: CharSpan[] } {
    // Bail out on very long lines to avoid O(n²) perf hit
    if (oldStr.length > 500 || newStr.length > 500) {
        return {
            oldSpans: [{ text: oldStr, highlight: true }],
            newSpans: [{ text: newStr, highlight: true }],
        };
    }

    const a = oldStr.split("");
    const b = newStr.split("");
    const dp = lcsTable(a, b);

    // Backtrack to find common chars
    const oldMarks = new Array(a.length).fill(false);
    const newMarks = new Array(b.length).fill(false);
    let i = a.length;
    let j = b.length;
    while (i > 0 && j > 0) {
        if (a[i - 1] === b[j - 1]) {
            oldMarks[i - 1] = true;
            newMarks[j - 1] = true;
            i--;
            j--;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    // Build spans — merge consecutive chars with same highlight state
    const buildSpans = (chars: string[], marks: boolean[]): CharSpan[] => {
        const spans: CharSpan[] = [];
        for (let k = 0; k < chars.length; k++) {
            const hl = !marks[k]; // unmarked = different = highlight
            if (spans.length > 0 && spans[spans.length - 1].highlight === hl) {
                spans[spans.length - 1].text += chars[k];
            } else {
                spans.push({ text: chars[k], highlight: hl });
            }
        }
        return spans;
    };

    return {
        oldSpans: buildSpans(a, oldMarks),
        newSpans: buildSpans(b, newMarks),
    };
}

/**
 * Compute a line-level diff between two texts.
 */
function computeDiff(original: string, modified: string, opts: DiffOptions): DiffLine[] {
    const oldLines = original.split("\n");
    const newLines = modified.split("\n");

    const normOld = oldLines.map((l) => normalizeLine(l, opts));
    const normNew = newLines.map((l) => normalizeLine(l, opts));

    const dp = lcsTable(normOld, normNew);

    // Backtrack to build diff
    const result: DiffLine[] = [];
    let i = oldLines.length;
    let j = newLines.length;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && normOld[i - 1] === normNew[j - 1]) {
            result.push({
                type: "unchanged",
                oldLine: oldLines[i - 1],
                oldLineNo: i,
                newLine: newLines[j - 1],
                newLineNo: j,
            });
            i--;
            j--;
        } else if (
            i > 0 &&
            j > 0 &&
            // Both sides would lose LCS length if skipped independently,
            // meaning neither line is on the LCS path → treat as modification
            dp[i - 1][j] < dp[i][j] &&
            dp[i][j - 1] < dp[i][j]
        ) {
            // Modified line — sub-diff at char level
            const { oldSpans, newSpans } = charDiff(oldLines[i - 1], newLines[j - 1]);
            result.push({
                type: "modified",
                oldLine: oldLines[i - 1],
                oldLineNo: i,
                newLine: newLines[j - 1],
                newLineNo: j,
                oldSpans,
                newSpans,
            });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.push({
                type: "added",
                newLine: newLines[j - 1],
                newLineNo: j,
            });
            j--;
        } else {
            result.push({
                type: "removed",
                oldLine: oldLines[i - 1],
                oldLineNo: i,
            });
            i--;
        }
    }

    return result.reverse();
}

// ── UI helpers ───────────────────────────────────────────────────────────────

const LINE_BG: Record<DiffLineType, string> = {
    added: "bg-emerald-50/80 dark:bg-emerald-500/10",
    removed: "bg-red-50/80 dark:bg-red-500/10",
    modified: "bg-amber-50/80 dark:bg-amber-500/10",
    unchanged: "",
};

const LINE_GUTTER: Record<DiffLineType, string> = {
    added: "text-emerald-600 dark:text-emerald-400",
    removed: "text-red-500 dark:text-red-400",
    modified: "text-amber-600 dark:text-amber-400",
    unchanged: "text-zinc-400 dark:text-zinc-600",
};

const CHAR_HL = {
    removed: "bg-red-200/70 dark:bg-red-500/30 rounded-sm",
    added: "bg-emerald-200/70 dark:bg-emerald-500/30 rounded-sm",
    modified_old: "bg-red-200/60 dark:bg-red-400/25 rounded-sm",
    modified_new: "bg-emerald-200/60 dark:bg-emerald-400/25 rounded-sm",
};

const UNIFIED_PREFIX: Record<DiffLineType, string> = {
    added: "+",
    removed: "-",
    modified: "~",
    unchanged: " ",
};

function renderSpans(spans: CharSpan[], hlClass: string) {
    return spans.map((s, i) =>
        s.highlight ? (
            <span key={i} className={hlClass}>
                {s.text}
            </span>
        ) : (
            <span key={i}>{s.text}</span>
        ),
    );
}

/** Build a unified diff string for clipboard */
function buildUnifiedText(diff: DiffLine[]): string {
    return diff
        .map((d) => {
            const prefix = UNIFIED_PREFIX[d.type];
            if (d.type === "modified") {
                return `- ${d.oldLine ?? ""}\n+ ${d.newLine ?? ""}`;
            }
            const line = d.type === "removed" ? d.oldLine : d.newLine;
            return `${prefix} ${line ?? ""}`;
        })
        .join("\n");
}

// ── Component ────────────────────────────────────────────────────────────────

type ViewMode = "side-by-side" | "unified";

export default function DiffChecker() {
    const [original, setOriginal] = useSessionState("diff-checker:original", "");
    const [modified, setModified] = useSessionState("diff-checker:modified", "");
    const [ignoreWhitespace, setIgnoreWhitespace] = useSessionState(
        "diff-checker:ignoreWs",
        false,
    );
    const [caseInsensitive, setCaseInsensitive] = useSessionState(
        "diff-checker:caseInsensitive",
        false,
    );
    const [viewMode, setViewMode] = useSessionState<ViewMode>(
        "diff-checker:view",
        "side-by-side",
    );
    const [copied, setCopied] = useState(false);

    const hasInput = original.trim() !== "" || modified.trim() !== "";

    const diff = useMemo<DiffLine[]>(() => {
        if (!original && !modified) return [];
        return computeDiff(original, modified, { ignoreWhitespace, caseInsensitive });
    }, [original, modified, ignoreWhitespace, caseInsensitive]);

    const stats = useMemo(() => {
        let added = 0;
        let removed = 0;
        let changed = 0;
        for (const d of diff) {
            if (d.type === "added") added++;
            else if (d.type === "removed") removed++;
            else if (d.type === "modified") changed++;
        }
        return { added, removed, changed };
    }, [diff]);

    const handleCopy = useCallback(async () => {
        const text = buildUnifiedText(diff);
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }, [diff]);

    const handleClear = useCallback(() => {
        setOriginal("");
        setModified("");
    }, []);

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">
            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-3">
                {/* View mode toggle */}
                <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                    <button
                        type="button"
                        onClick={() => setViewMode("side-by-side")}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${viewMode === "side-by-side"
                            ? "bg-indigo-500 text-white shadow-sm"
                            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                            }`}
                    >
                        <Columns2 className="h-3.5 w-3.5" />
                        Side-by-side
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("unified")}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${viewMode === "unified"
                            ? "bg-indigo-500 text-white shadow-sm"
                            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                            }`}
                    >
                        <AlignLeft className="h-3.5 w-3.5" />
                        Unified
                    </button>
                </div>

                <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

                {/* Options toggles */}
                <button
                    type="button"
                    onClick={() => setIgnoreWhitespace((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${ignoreWhitespace
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-600/50 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                        }`}
                >
                    <Space className="h-3.5 w-3.5" />
                    Ignore whitespace
                </button>

                <button
                    type="button"
                    onClick={() => setCaseInsensitive((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${caseInsensitive
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-600/50 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                        }`}
                >
                    <CaseSensitive className="h-3.5 w-3.5" />
                    Ignore case
                </button>

                <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={diff.length === 0}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    {copied ? (
                        <>
                            <Check className="h-4 w-4 text-emerald-500" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="h-4 w-4" />
                            Copy diff
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleClear}
                    disabled={!hasInput}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    <Trash2 className="h-4 w-4" />
                    Clear
                </button>
            </div>

            {/* Input textareas */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Original */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Original
                    </label>
                    <textarea
                        value={original}
                        onChange={(e) => setOriginal(e.target.value)}
                        placeholder="Paste original text here…"
                        spellCheck={false}
                        wrap="off"
                        className="block w-full min-h-[200px] resize-y rounded-xl border border-zinc-200 bg-white p-4 font-mono text-[13px] leading-relaxed text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                    />
                </div>

                {/* Modified */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Modified
                    </label>
                    <textarea
                        value={modified}
                        onChange={(e) => setModified(e.target.value)}
                        placeholder="Paste modified text here…"
                        spellCheck={false}
                        wrap="off"
                        className="block w-full min-h-[200px] resize-y rounded-xl border border-zinc-200 bg-white p-4 font-mono text-[13px] leading-relaxed text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                    />
                </div>
            </div>

            {/* Stats bar */}
            {diff.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-900/60">
                    <span className="text-zinc-500 dark:text-zinc-400">
                        {diff.length} line{diff.length !== 1 ? "s" : ""}
                    </span>
                    {stats.added > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                            +{stats.added} added
                        </span>
                    )}
                    {stats.removed > 0 && (
                        <span className="text-red-500 dark:text-red-400">
                            −{stats.removed} removed
                        </span>
                    )}
                    {stats.changed > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">
                            ~{stats.changed} modified
                        </span>
                    )}
                    {stats.added === 0 && stats.removed === 0 && stats.changed === 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                            ✓ No differences
                        </span>
                    )}
                </div>
            )}

            {/* Diff output */}
            {diff.length > 0 && (
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {viewMode === "side-by-side" ? "Side-by-side diff" : "Unified diff"}
                    </label>

                    {viewMode === "side-by-side" ? (
                        <SideBySideView diff={diff} />
                    ) : (
                        <UnifiedView diff={diff} />
                    )}
                </div>
            )}

            {/* Empty state */}
            {!hasInput && (
                <div className="rounded-xl border-2 border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Paste text in both boxes above to see differences
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Side-by-side view ────────────────────────────────────────────────────────

function SideBySideView({ diff }: { diff: DiffLine[] }) {
    return (
        <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-700">
            {/* Left (original) */}
            <div className="overflow-auto border-r border-zinc-200 dark:border-zinc-700">
                <div className="min-w-0">
                    {diff.map((d, i) => {
                        const show = d.type !== "added";
                        return (
                            <div
                                key={i}
                                className={`flex min-h-[24px] font-mono text-[13px] leading-relaxed ${d.type === "added" ? "bg-zinc-50 dark:bg-zinc-900/40" : LINE_BG[d.type]
                                    }`}
                            >
                                <span
                                    className={`shrink-0 select-none border-r border-zinc-100 px-3 py-0.5 text-right font-mono text-[12px] dark:border-zinc-800 w-12 ${show ? LINE_GUTTER[d.type] : "text-transparent"
                                        }`}
                                >
                                    {show ? d.oldLineNo : ""}
                                </span>
                                <span className="flex-1 whitespace-pre px-3 py-0.5 text-zinc-800 dark:text-zinc-200">
                                    {show ? (
                                        d.oldSpans ? (
                                            renderSpans(d.oldSpans, CHAR_HL.modified_old)
                                        ) : (
                                            d.oldLine
                                        )
                                    ) : (
                                        ""
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right (modified) */}
            <div className="overflow-auto">
                <div className="min-w-0">
                    {diff.map((d, i) => {
                        const show = d.type !== "removed";
                        return (
                            <div
                                key={i}
                                className={`flex min-h-[24px] font-mono text-[13px] leading-relaxed ${d.type === "removed" ? "bg-zinc-50 dark:bg-zinc-900/40" : LINE_BG[d.type]
                                    }`}
                            >
                                <span
                                    className={`shrink-0 select-none border-r border-zinc-100 px-3 py-0.5 text-right font-mono text-[12px] dark:border-zinc-800 w-12 ${show ? LINE_GUTTER[d.type] : "text-transparent"
                                        }`}
                                >
                                    {show ? d.newLineNo : ""}
                                </span>
                                <span className="flex-1 whitespace-pre px-3 py-0.5 text-zinc-800 dark:text-zinc-200">
                                    {show ? (
                                        d.newSpans ? (
                                            renderSpans(d.newSpans, CHAR_HL.modified_new)
                                        ) : (
                                            d.newLine
                                        )
                                    ) : (
                                        ""
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── Unified view ─────────────────────────────────────────────────────────────

function UnifiedView({ diff }: { diff: DiffLine[] }) {
    return (
        <div className="overflow-auto rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-700">
            {diff.map((d, i) => {
                if (d.type === "modified") {
                    // Show as two lines: removal then addition
                    return (
                        <div key={i}>
                            <div className={`flex min-h-[24px] font-mono text-[13px] leading-relaxed ${LINE_BG.removed}`}>
                                <span className={`shrink-0 select-none border-r border-zinc-100 px-3 py-0.5 text-right text-[12px] dark:border-zinc-800 w-12 ${LINE_GUTTER.removed}`}>
                                    {d.oldLineNo}
                                </span>
                                <span className={`shrink-0 select-none px-2 py-0.5 text-[12px] font-bold ${LINE_GUTTER.removed}`}>
                                    −
                                </span>
                                <span className="flex-1 whitespace-pre py-0.5 pr-3 text-zinc-800 dark:text-zinc-200">
                                    {d.oldSpans
                                        ? renderSpans(d.oldSpans, CHAR_HL.modified_old)
                                        : d.oldLine}
                                </span>
                            </div>
                            <div className={`flex min-h-[24px] font-mono text-[13px] leading-relaxed ${LINE_BG.added}`}>
                                <span className={`shrink-0 select-none border-r border-zinc-100 px-3 py-0.5 text-right text-[12px] dark:border-zinc-800 w-12 ${LINE_GUTTER.added}`}>
                                    {d.newLineNo}
                                </span>
                                <span className={`shrink-0 select-none px-2 py-0.5 text-[12px] font-bold ${LINE_GUTTER.added}`}>
                                    +
                                </span>
                                <span className="flex-1 whitespace-pre py-0.5 pr-3 text-zinc-800 dark:text-zinc-200">
                                    {d.newSpans
                                        ? renderSpans(d.newSpans, CHAR_HL.modified_new)
                                        : d.newLine}
                                </span>
                            </div>
                        </div>
                    );
                }

                const lineNo = d.type === "removed" ? d.oldLineNo : d.newLineNo;
                const text = d.type === "removed" ? d.oldLine : d.newLine;
                const prefix =
                    d.type === "added"
                        ? "+"
                        : d.type === "removed"
                            ? "−"
                            : " ";

                return (
                    <div
                        key={i}
                        className={`flex min-h-[24px] font-mono text-[13px] leading-relaxed ${LINE_BG[d.type]}`}
                    >
                        <span
                            className={`shrink-0 select-none border-r border-zinc-100 px-3 py-0.5 text-right text-[12px] dark:border-zinc-800 w-12 ${LINE_GUTTER[d.type]}`}
                        >
                            {lineNo}
                        </span>
                        <span
                            className={`shrink-0 select-none px-2 py-0.5 text-[12px] font-bold ${LINE_GUTTER[d.type]}`}
                        >
                            {prefix}
                        </span>
                        <span className="flex-1 whitespace-pre py-0.5 pr-3 text-zinc-800 dark:text-zinc-200">
                            {text}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
