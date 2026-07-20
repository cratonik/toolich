"use client";

import { useState, useMemo, useCallback, useRef, useEffect, memo } from "react";
import {
    Copy,
    Check,
    Trash2,
    Columns2,
    AlignLeft,
    CaseSensitive,
    Space,
    ChevronDown,
    ChevronUp,
    Link as LinkIcon,
    Unlink,
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
 * Post-processes line diff results to pair up contiguous deletions and additions
 * into modified lines, enabling character-level sub-highlighting.
 */
function pairDiffLines(lines: DiffLine[]): DiffLine[] {
    const paired: DiffLine[] = [];
    let i = 0;
    while (i < lines.length) {
        if (lines[i].type === "unchanged") {
            paired.push(lines[i]);
            i++;
            continue;
        }

        // Collect contiguous block of modifications (additions/deletions)
        const block: DiffLine[] = [];
        while (i < lines.length && lines[i].type !== "unchanged") {
            block.push(lines[i]);
            i++;
        }

        const removed = block.filter((x) => x.type === "removed");
        const added = block.filter((x) => x.type === "added");
        const minLen = Math.min(removed.length, added.length);

        // Pair them up as modified lines
        for (let k = 0; k < minLen; k++) {
            const r = removed[k];
            const a = added[k];
            const { oldSpans, newSpans } = charDiff(r.oldLine ?? "", a.newLine ?? "");
            paired.push({
                type: "modified",
                oldLine: r.oldLine,
                oldLineNo: r.oldLineNo,
                newLine: a.newLine,
                newLineNo: a.newLineNo,
                oldSpans,
                newSpans,
            });
        }

        // Append remaining unpaired lines
        if (removed.length > minLen) {
            for (let k = minLen; k < removed.length; k++) {
                paired.push(removed[k]);
            }
        } else if (added.length > minLen) {
            for (let k = minLen; k < added.length; k++) {
                paired.push(added[k]);
            }
        }
    }
    return paired;
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

    return pairDiffLines(result.reverse());
}

// ── UI helpers ───────────────────────────────────────────────────────────────

const LINE_BG: Record<DiffLineType, string> = {
    added: "bg-emerald-100/30 dark:bg-emerald-950/30",
    removed: "bg-red-100/30 dark:bg-red-950/30",
    modified: "bg-amber-100/30 dark:bg-amber-950/30",
    unchanged: "",
};

const LINE_GUTTER: Record<DiffLineType, string> = {
    added: "text-emerald-600 dark:text-emerald-400",
    removed: "text-red-500 dark:text-red-400",
    modified: "text-amber-600 dark:text-amber-400",
    unchanged: "text-zinc-400 dark:text-zinc-600",
};

const CHAR_HL = {
    removed: "bg-red-200/90 text-red-900 dark:bg-red-500/40 dark:text-red-100 rounded-sm px-[1px]",
    added: "bg-emerald-200/90 text-emerald-900 dark:bg-emerald-500/40 dark:text-emerald-100 rounded-sm px-[1px]",
    modified_old: "bg-red-300/90 text-red-950 dark:bg-red-500/60 dark:text-red-100 rounded-sm px-[1px]",
    modified_new: "bg-emerald-300/90 text-emerald-950 dark:bg-emerald-500/60 dark:text-emerald-100 rounded-sm px-[1px]",
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

// ── Input Textarea with Line Numbers Gutter ──────────────────────────────────

function TextareaWithLineNumbers({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
}) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const gutterRef = useRef<HTMLDivElement | null>(null);

    const lines = useMemo(() => {
        const count = value.split("\n").length;
        return Array.from({ length: count }, (_, i) => i + 1);
    }, [value]);

    const handleScroll = useCallback(() => {
        if (textareaRef.current && gutterRef.current) {
            gutterRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    }, []);

    // Sync scroll when lines length changes to prevent line offsets
    useEffect(() => {
        handleScroll();
    }, [lines.length, handleScroll]);

    return (
        <div className="flex w-full h-[250px] resize-y rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 shadow-sm overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:focus-within:border-indigo-500 dark:focus-within:ring-indigo-500/20">
            {/* Line Numbers Gutter */}
            <div
                ref={gutterRef}
                className="w-10 select-none py-4 text-right pr-2 bg-zinc-50 dark:bg-zinc-950/40 border-r border-zinc-150 dark:border-zinc-800 text-[13px] font-mono leading-relaxed text-zinc-400 dark:text-zinc-600 overflow-hidden h-full"
            >
                {lines.map((l) => (
                    <div key={l}>
                        {l}
                    </div>
                ))}
            </div>

            {/* Textarea */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    requestAnimationFrame(handleScroll);
                }}
                onScroll={handleScroll}
                placeholder={placeholder}
                spellCheck={false}
                wrap="off"
                className="flex-1 h-full p-4 pl-3 bg-transparent font-mono text-[13px] leading-relaxed text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 overflow-y-auto resize-none"
            />
        </div>
    );
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
    const [syncScroll, setSyncScroll] = useSessionState("diff-checker:sync-scroll", true);
    const [copied, setCopied] = useState(false);

    const hasInput = original.trim() !== "" || modified.trim() !== "";

    const diff = useMemo<DiffLine[]>(() => {
        if (!original && !modified) return [];
        return computeDiff(original, modified, { ignoreWhitespace, caseInsensitive });
    }, [original, modified, ignoreWhitespace, caseInsensitive]);

    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const [scrollState, setScrollState] = useState({
        scrollTop: 0,
        scrollHeight: 1,
        clientHeight: 1,
    });

    const updateScrollMetrics = useCallback((el: HTMLDivElement | null) => {
        if (!el) return;
        setScrollState({
            scrollTop: el.scrollTop,
            scrollHeight: el.scrollHeight || 1,
            clientHeight: el.clientHeight || 1,
        });
    }, []);

    const setScrollContainer = useCallback((el: HTMLDivElement | null) => {
        scrollContainerRef.current = el;
        updateScrollMetrics(el);
    }, [updateScrollMetrics]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        updateScrollMetrics(e.currentTarget);
    }, [updateScrollMetrics]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (scrollContainerRef.current) {
                updateScrollMetrics(scrollContainerRef.current);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [diff, viewMode, updateScrollMetrics]);

    const scrollToLine = useCallback((index: number) => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const lineElement = container.querySelector(`#diff-line-${index}`);
        if (lineElement) {
            const containerRect = container.getBoundingClientRect();
            const lineRect = lineElement.getBoundingClientRect();
            const relativeTop = lineRect.top - containerRect.top + container.scrollTop;

            container.scrollTo({
                top: relativeTop - (containerRect.height / 2) + (lineRect.height / 2),
                behavior: "smooth"
            });
        }
    }, []);

    const handleRulerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const percentage = clickY / rect.height;
        const targetLineIndex = Math.max(0, Math.min(diff.length - 1, Math.floor(percentage * diff.length)));
        scrollToLine(targetLineIndex);
    }, [diff.length, scrollToLine]);

    const markers = useMemo(() => {
        return diff
            .map((d, index) => ({ d, index }))
            .filter(({ d }) => d.type !== "unchanged");
    }, [diff]);

    const diffIndices = useMemo(() => {
        const indices: number[] = [];
        for (let idx = 0; idx < diff.length; idx++) {
            if (diff[idx].type !== "unchanged") {
                indices.push(idx);
            }
        }
        return indices;
    }, [diff]);

    const scrollToNextDiff = useCallback((currentIndex: number) => {
        if (diffIndices.length === 0) return;
        const currentPos = diffIndices.indexOf(currentIndex);
        if (currentPos === -1) return;

        const nextPos = (currentPos + 1) % diffIndices.length;
        const nextLineIndex = diffIndices[nextPos];
        scrollToLine(nextLineIndex);
    }, [diffIndices, scrollToLine]);

    const scrollToPrevDiff = useCallback((currentIndex: number) => {
        if (diffIndices.length === 0) return;
        const currentPos = diffIndices.indexOf(currentIndex);
        if (currentPos === -1) return;

        const prevPos = (currentPos - 1 + diffIndices.length) % diffIndices.length;
        const prevLineIndex = diffIndices[prevPos];
        scrollToLine(prevLineIndex);
    }, [diffIndices, scrollToLine]);

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

                {viewMode === "side-by-side" && (
                    <button
                        type="button"
                        onClick={() => setSyncScroll((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${syncScroll
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-600/50 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                            }`}
                    >
                        {syncScroll ? <LinkIcon className="h-3.5 w-3.5" /> : <Unlink className="h-3.5 w-3.5" />}
                        Sync scroll
                    </button>
                )}

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
                    <TextareaWithLineNumbers
                        value={original}
                        onChange={setOriginal}
                        placeholder="Paste original text here…"
                    />
                </div>

                {/* Modified */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Modified
                    </label>
                    <TextareaWithLineNumbers
                        value={modified}
                        onChange={setModified}
                        placeholder="Paste modified text here…"
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

                    <div className="relative flex items-stretch gap-2.5 w-full">
                        {/* Diff view container */}
                        <div className="flex-1 min-w-0">
                            {viewMode === "side-by-side" ? (
                                <SideBySideView
                                    diff={diff}
                                    containerRef={setScrollContainer}
                                    onScroll={handleScroll}
                                    scrollToNextDiff={scrollToNextDiff}
                                    scrollToPrevDiff={scrollToPrevDiff}
                                    diffIndices={diffIndices}
                                    syncScroll={syncScroll}
                                />
                            ) : (
                                <UnifiedView
                                    diff={diff}
                                    containerRef={setScrollContainer}
                                    onScroll={handleScroll}
                                    scrollToNextDiff={scrollToNextDiff}
                                    scrollToPrevDiff={scrollToPrevDiff}
                                    diffIndices={diffIndices}
                                />
                            )}
                        </div>

                        {/* Overview Ruler (Diff Minimap) */}
                        <div
                            onClick={handleRulerClick}
                            className="w-3 rounded-xl border border-zinc-200 bg-zinc-50/50 dark:border-zinc-700/60 dark:bg-zinc-800/30 relative select-none flex-shrink-0 cursor-pointer overflow-hidden self-stretch"
                            title="Diff minimap — click to jump to change"
                        >
                            {/* Viewport Range Indicator */}
                            <div
                                className="absolute left-0 right-0 bg-zinc-400/20 dark:bg-zinc-350/20 border-y border-zinc-400/30 dark:border-zinc-500/25 pointer-events-none transition-all duration-75"
                                style={{
                                    top: `${(scrollState.scrollTop / scrollState.scrollHeight) * 100}%`,
                                    height: `${(scrollState.clientHeight / scrollState.scrollHeight) * 100}%`,
                                }}
                            />

                            {/* Diff markers */}
                            {markers.map(({ d, index }) => {
                                const topPercent = (index / diff.length) * 100;
                                const markerColor =
                                    d.type === "added"
                                        ? "bg-emerald-500 dark:bg-emerald-400"
                                        : d.type === "removed"
                                        ? "bg-red-500 dark:bg-red-400"
                                        : "bg-amber-500 dark:bg-amber-400";
                                const label = d.type === "added" ? "Added" : d.type === "removed" ? "Removed" : "Modified";
                                const lineNo = d.type === "added" ? d.newLineNo : d.oldLineNo;

                                return (
                                    <div
                                        key={index}
                                        className={`absolute left-0.5 right-0.5 h-[3px] rounded-sm opacity-80 hover:opacity-100 ${markerColor} transition-opacity`}
                                        style={{ top: `${topPercent}%` }}
                                        title={`Line ${lineNo}: ${label}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            scrollToLine(index);
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
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

const SideBySideView = memo(function SideBySideView({
    diff,
    containerRef,
    onScroll,
    scrollToNextDiff,
    scrollToPrevDiff,
    diffIndices,
    syncScroll,
}: {
    diff: DiffLine[];
    containerRef: (el: HTMLDivElement | null) => void;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    scrollToNextDiff: (index: number) => void;
    scrollToPrevDiff: (index: number) => void;
    diffIndices: number[];
    syncScroll: boolean;
}) {
    const leftScrollRef = useRef<HTMLDivElement>(null);
    const rightScrollRef = useRef<HTMLDivElement>(null);
    const isSyncingLeft = useRef(false);
    const isSyncingRight = useRef(false);

    const handleLeftScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!syncScroll) return;
        if (isSyncingLeft.current) {
            isSyncingLeft.current = false;
            return;
        }
        if (rightScrollRef.current) {
            isSyncingRight.current = true;
            rightScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    const handleRightScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!syncScroll) return;
        if (isSyncingRight.current) {
            isSyncingRight.current = false;
            return;
        }
        if (leftScrollRef.current) {
            isSyncingLeft.current = true;
            leftScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    return (
        <div
            ref={containerRef}
            onScroll={onScroll}
            className="max-h-[600px] overflow-y-auto border border-zinc-200 rounded-xl shadow-sm dark:border-zinc-700 bg-white dark:bg-zinc-900"
        >
            <div className="grid grid-cols-2 min-w-[800px] divide-x divide-zinc-200 dark:divide-zinc-700">
                {/* Left (original) */}
                <div
                    ref={leftScrollRef}
                    onScroll={handleLeftScroll}
                    className="min-w-0 overflow-x-auto pb-4"
                >
                    <div className="w-max min-w-full">
                        {diff.map((d, i) => {
                        const show = d.type !== "added";
                        const bgClass = d.type === "modified"
                            ? LINE_BG.removed
                            : d.type === "added"
                            ? "bg-zinc-50 dark:bg-zinc-900/40"
                            : LINE_BG[d.type];
                        const gutterColor = d.type === "modified" ? LINE_GUTTER.removed : LINE_GUTTER[d.type];

                        const isDiffLine = d.type !== "unchanged";

                        return (
                            <div
                                key={i}
                                id={`diff-line-${i}`}
                                className={`flex h-[26px] font-mono text-[13px] leading-[26px] ${bgClass}`}
                            >
                                <div className="sticky left-0 z-10 shrink-0 w-16 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800">
                                    <div
                                        className={`w-full h-full flex items-center justify-between select-none px-2 text-right font-mono text-[12px] ${
                                            show ? gutterColor : "text-transparent"
                                        } ${bgClass}`}
                                    >
                                        <span>{show ? d.oldLineNo : ""}</span>
                                        {show && isDiffLine && (
                                            <div className="flex -mr-1">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        scrollToPrevDiff(i);
                                                    }}
                                                    className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                                                    title="Jump to previous difference"
                                                >
                                                    <ChevronUp className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        scrollToNextDiff(i);
                                                    }}
                                                    className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                                                    title="Jump to next difference"
                                                >
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="flex-1 whitespace-pre px-3 text-zinc-800 dark:text-zinc-200 font-mono">
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
                <div
                    ref={rightScrollRef}
                    onScroll={handleRightScroll}
                    className="min-w-0 overflow-x-auto pb-4"
                >
                    <div className="w-max min-w-full">
                        {diff.map((d, i) => {
                        const show = d.type !== "removed";
                        const bgClass = d.type === "modified"
                            ? LINE_BG.added
                            : d.type === "removed"
                            ? "bg-zinc-50 dark:bg-zinc-900/40"
                            : LINE_BG[d.type];
                        const gutterColor = d.type === "modified" ? LINE_GUTTER.added : LINE_GUTTER[d.type];

                        const isDiffLine = d.type !== "unchanged";

                        return (
                            <div
                                key={i}
                                className={`flex h-[26px] font-mono text-[13px] leading-[26px] ${bgClass}`}
                            >
                                <div className="sticky left-0 z-10 shrink-0 w-16 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800">
                                    <div
                                        className={`w-full h-full flex items-center justify-between select-none px-2 text-right font-mono text-[12px] ${
                                            show ? gutterColor : "text-transparent"
                                        } ${bgClass}`}
                                    >
                                        <span>{show ? d.newLineNo : ""}</span>
                                        {show && isDiffLine && (
                                            <div className="flex -mr-1">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        scrollToPrevDiff(i);
                                                    }}
                                                    className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                                                    title="Jump to previous difference"
                                                >
                                                    <ChevronUp className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        scrollToNextDiff(i);
                                                    }}
                                                    className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                                                    title="Jump to next difference"
                                                >
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="flex-1 whitespace-pre px-3 text-zinc-800 dark:text-zinc-200 font-mono">
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
        </div>
    );
});

// ── Unified view ─────────────────────────────────────────────────────────────

const UnifiedView = memo(function UnifiedView({
    diff,
    containerRef,
    onScroll,
    scrollToNextDiff,
    scrollToPrevDiff,
    diffIndices,
}: {
    diff: DiffLine[];
    containerRef: (el: HTMLDivElement | null) => void;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    scrollToNextDiff: (index: number) => void;
    scrollToPrevDiff: (index: number) => void;
    diffIndices: number[];
}) {
    return (
        <div
            ref={containerRef}
            onScroll={onScroll}
            className="max-h-[600px] overflow-y-auto rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-700 bg-white dark:bg-zinc-900"
        >
            <div className="min-w-[500px]">
                {diff.map((d, i) => {
                    if (d.type === "modified") {
                        // Show as two lines: removal then addition
                        return (
                            <div key={i} id={`diff-line-${i}`}>
                                <div className={`flex min-h-[24px] font-mono text-[13px] leading-relaxed ${LINE_BG.removed}`}>
                                    <div className={`shrink-0 select-none border-r border-zinc-100 px-2.5 py-0.5 text-right font-mono text-[12px] dark:border-zinc-800 w-16 flex items-center justify-between ${LINE_GUTTER.removed}`}>
                                        <span>{d.oldLineNo}</span>
                                        <div className="flex -mr-1">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    scrollToPrevDiff(i);
                                                }}
                                                className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors cursor-pointer font-sans"
                                                title="Jump to previous difference"
                                            >
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    scrollToNextDiff(i);
                                                }}
                                                className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors cursor-pointer font-sans"
                                                title="Jump to next difference"
                                            >
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <span className={`shrink-0 select-none px-2 py-0.5 text-[12px] font-bold ${LINE_GUTTER.removed}`}>
                                        −
                                    </span>
                                    <span className="flex-1 whitespace-pre py-0.5 pr-3 text-zinc-800 dark:text-zinc-200 font-mono">
                                        {d.oldSpans
                                            ? renderSpans(d.oldSpans, CHAR_HL.modified_old)
                                            : d.oldLine}
                                    </span>
                                </div>
                                <div className={`flex min-h-[24px] font-mono text-[13px] leading-relaxed ${LINE_BG.added}`}>
                                    <div className={`shrink-0 select-none border-r border-zinc-100 px-2.5 py-0.5 text-right font-mono text-[12px] dark:border-zinc-800 w-16 flex items-center justify-between ${LINE_GUTTER.added}`}>
                                        <span>{d.newLineNo}</span>
                                    </div>
                                    <span className={`shrink-0 select-none px-2 py-0.5 text-[12px] font-bold ${LINE_GUTTER.added}`}>
                                        +
                                    </span>
                                    <span className="flex-1 whitespace-pre py-0.5 pr-3 text-zinc-800 dark:text-zinc-200 font-mono">
                                        {d.newSpans
                                            ? renderSpans(d.newSpans, CHAR_HL.modified_new)
                                            : d.newLine}
                                    </span>
                                </div>
                            </div>
                        );
                    }

                    const isDiffLine = d.type !== "unchanged";
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
                            id={`diff-line-${i}`}
                            className={`flex min-h-[24px] font-mono text-[13px] leading-relaxed ${LINE_BG[d.type]}`}
                        >
                            <div
                                className={`shrink-0 select-none border-r border-zinc-100 px-2.5 py-0.5 text-right font-mono text-[12px] dark:border-zinc-800 w-16 flex items-center justify-between ${LINE_GUTTER[d.type]}`}
                            >
                                <span>{lineNo}</span>
                                {isDiffLine && (
                                    <div className="flex -mr-1">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                scrollToPrevDiff(i);
                                            }}
                                            className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors cursor-pointer font-sans"
                                            title="Jump to previous difference"
                                        >
                                            <ChevronUp className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                scrollToNextDiff(i);
                                            }}
                                            className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors cursor-pointer font-sans"
                                            title="Jump to next difference"
                                        >
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
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
        </div>
    );
});
