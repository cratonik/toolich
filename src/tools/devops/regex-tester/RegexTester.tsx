"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
    Copy,
    Check,
    Trash2,
    Zap,
    FlaskConical,
    Wand2,
    ArrowRight,
    Info,
    HelpCircle,
} from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";
import { generateFromDescription, type GeneratedPattern } from "./regex-generator";

// ---------------------------------------------------------------------------
// Cheat-sheet data
// ---------------------------------------------------------------------------

const CHEAT_SHEET = [
    { token: ".", desc: "any character" },
    { token: "\\d", desc: "digit [0-9]" },
    { token: "\\D", desc: "non-digit" },
    { token: "\\w", desc: "word char [a-zA-Z0-9_]" },
    { token: "\\W", desc: "non-word" },
    { token: "\\s", desc: "whitespace" },
    { token: "\\S", desc: "non-whitespace" },
    { token: "\\b", desc: "word boundary" },
    { token: "^", desc: "start of line" },
    { token: "$", desc: "end of line" },
    { token: "*", desc: "0 or more" },
    { token: "+", desc: "1 or more" },
    { token: "?", desc: "0 or 1" },
    { token: "{n}", desc: "exactly n" },
    { token: "{n,m}", desc: "n to m" },
    { token: "[abc]", desc: "character class" },
    { token: "[^abc]", desc: "negated class" },
    { token: "(…)", desc: "capture group" },
    { token: "(?:…)", desc: "non-capture group" },
    { token: "a|b", desc: "alternation" },
    { token: "(?=…)", desc: "lookahead" },
    { token: "(?!…)", desc: "negative lookahead" },
];

const FLAGS_INFO: { flag: string; label: string; desc: string }[] = [
    { flag: "g", label: "g", desc: "Global — find all matches" },
    { flag: "i", label: "i", desc: "Case-insensitive" },
    { flag: "m", label: "m", desc: "Multiline (^ and $ per line)" },
    { flag: "s", label: "s", desc: "Dotall (. matches newline)" },
    { flag: "u", label: "u", desc: "Unicode" },
];

// ---------------------------------------------------------------------------
// Match types
// ---------------------------------------------------------------------------

type MatchInfo = {
    fullMatch: string;
    index: number;
    length: number;
    groups: string[];
};

type HighlightSegment = {
    text: string;
    isMatch: boolean;
    matchIdx?: number;
};

// ---------------------------------------------------------------------------
// Match colors — cycle through these for multiple matches
// ---------------------------------------------------------------------------

const MATCH_COLORS = [
    "bg-amber-200/70 dark:bg-amber-500/30",
    "bg-sky-200/70 dark:bg-sky-500/30",
    "bg-emerald-200/70 dark:bg-emerald-500/30",
    "bg-purple-200/70 dark:bg-purple-500/30",
    "bg-rose-200/70 dark:bg-rose-500/30",
    "bg-orange-200/70 dark:bg-orange-500/30",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type TabMode = "tester" | "generator";

export default function RegexTester() {
    // ---- persisted state ----
    const [pattern, setPattern] = useSessionState("regex:pattern", "");
    const [testStr, setTestStr] = useSessionState("regex:test", "");
    const [flagG, setFlagG] = useSessionState("regex:flag-g", true);
    const [flagI, setFlagI] = useSessionState("regex:flag-i", false);
    const [flagM, setFlagM] = useSessionState("regex:flag-m", false);
    const [flagS, setFlagS] = useSessionState("regex:flag-s", false);
    const [flagU, setFlagU] = useSessionState("regex:flag-u", false);
    const [genInput, setGenInput] = useSessionState("regex:gen-input", "");

    // ---- transient state ----
    const [tab, setTab] = useState<TabMode>("tester");
    const [copied, setCopied] = useState(false);
    const [genResult, setGenResult] = useState<GeneratedPattern | null>(null);
    const [genError, setGenError] = useState("");
    const [showCheatSheet, setShowCheatSheet] = useState(false);

    const patternRef = useRef<HTMLInputElement>(null);

    // ---- flag string ----
    const flags = useMemo(() => {
        let f = "";
        if (flagG) f += "g";
        if (flagI) f += "i";
        if (flagM) f += "m";
        if (flagS) f += "s";
        if (flagU) f += "u";
        return f;
    }, [flagG, flagI, flagM, flagS, flagU]);

    const flagSetters: Record<string, (v: boolean) => void> = {
        g: setFlagG,
        i: setFlagI,
        m: setFlagM,
        s: setFlagS,
        u: setFlagU,
    };
    const flagGetters: Record<string, boolean> = {
        g: flagG,
        i: flagI,
        m: flagM,
        s: flagS,
        u: flagU,
    };

    // ---- regex compilation ----
    const { regex, error: regexError } = useMemo(() => {
        if (!pattern) return { regex: null, error: "" };
        try {
            return { regex: new RegExp(pattern, flags), error: "" };
        } catch (e) {
            return {
                regex: null,
                error: e instanceof Error ? e.message : "Invalid regex",
            };
        }
    }, [pattern, flags]);

    // ---- matching ----
    const matches = useMemo<MatchInfo[]>(() => {
        if (!regex || !testStr) return [];
        const results: MatchInfo[] = [];
        // Use matchAll for global, exec for non-global
        if (flags.includes("g")) {
            const iter = testStr.matchAll(new RegExp(pattern, flags));
            for (const m of iter) {
                results.push({
                    fullMatch: m[0],
                    index: m.index ?? 0,
                    length: m[0].length,
                    groups: m.slice(1).map((g) => g ?? ""),
                });
            }
        } else {
            const m = regex.exec(testStr);
            if (m) {
                results.push({
                    fullMatch: m[0],
                    index: m.index ?? 0,
                    length: m[0].length,
                    groups: m.slice(1).map((g) => g ?? ""),
                });
            }
        }
        return results;
    }, [regex, testStr, pattern, flags]);

    // ---- highlighted segments ----
    const segments = useMemo<HighlightSegment[]>(() => {
        if (!testStr || matches.length === 0) {
            return testStr ? [{ text: testStr, isMatch: false }] : [];
        }
        const result: HighlightSegment[] = [];
        let cursor = 0;
        for (let i = 0; i < matches.length; i++) {
            const m = matches[i];
            if (m.index > cursor) {
                result.push({ text: testStr.slice(cursor, m.index), isMatch: false });
            }
            result.push({
                text: testStr.slice(m.index, m.index + m.length),
                isMatch: true,
                matchIdx: i,
            });
            cursor = m.index + m.length;
        }
        if (cursor < testStr.length) {
            result.push({ text: testStr.slice(cursor), isMatch: false });
        }
        return result;
    }, [testStr, matches]);

    // ---- actions ----
    const handleCopy = async () => {
        const full = `/${pattern}/${flags}`;
        await navigator.clipboard.writeText(full);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleClear = () => {
        setPattern("");
        setTestStr("");
    };

    const insertToken = (token: string) => {
        setPattern((prev: string) => prev + token);
        patternRef.current?.focus();
    };

    const handleGenerate = useCallback(() => {
        setGenError("");
        const result = generateFromDescription(genInput);
        if (result) {
            setGenResult(result);
        } else {
            setGenResult(null);
            setGenError(
                "No matching pattern found. Try keywords like: email, URL, phone, IP address, date, UUID, hex color, password, etc.",
            );
        }
    }, [genInput]);

    const sendToTester = () => {
        if (!genResult) return;
        setPattern(genResult.regex);
        // Set flags
        setFlagG(genResult.flags.includes("g"));
        setFlagI(genResult.flags.includes("i"));
        setFlagM(genResult.flags.includes("m"));
        setFlagS(genResult.flags.includes("s"));
        setFlagU(genResult.flags.includes("u"));
        setTab("tester");
    };

    return (
        <div className="space-y-6">
            {/* ── Tab toggle ── */}
            <div className="inline-flex rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                {([
                    { id: "tester" as TabMode, icon: FlaskConical, label: "Tester" },
                    { id: "generator" as TabMode, icon: Wand2, label: "Generator" },
                ]).map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all first:rounded-l-lg last:rounded-r-lg ${tab === t.id
                                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                            }`}
                    >
                        <t.icon className="h-3.5 w-3.5" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ================================================================ */}
            {/* TESTER TAB                                                      */}
            {/* ================================================================ */}
            {tab === "tester" && (
                <>
                    {/* ── Helper intro ── */}
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3 dark:border-indigo-500/20 dark:bg-indigo-500/5">
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            <strong>How it works:</strong> Enter a regex pattern and a test string below.
                            Matches will be highlighted in real-time with captured groups shown underneath.
                            Toggle flags like <code className="rounded bg-indigo-100 px-1 font-mono text-xs dark:bg-indigo-500/20">g</code> (global)
                            and <code className="rounded bg-indigo-100 px-1 font-mono text-xs dark:bg-indigo-500/20">i</code> (case-insensitive) to adjust matching.
                        </p>
                    </div>

                    {/* ── Quick try examples ── */}
                    {!pattern && !testStr && (
                        <div className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Quick Try — click to load an example
                            </span>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {[
                                    {
                                        label: "Find emails",
                                        pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
                                        test: "Contact us at support@example.com or sales@company.org for help.",
                                        flagsG: true, flagsI: true,
                                    },
                                    {
                                        label: "Extract numbers",
                                        pattern: "-?\\d+\\.?\\d*",
                                        test: "The temperature was -3.5°C yesterday and 12°C today. Wind: 25 km/h.",
                                        flagsG: true, flagsI: false,
                                    },
                                    {
                                        label: "Match dates",
                                        pattern: "\\d{4}[-/]\\d{2}[-/]\\d{2}",
                                        test: "The project started on 2024-01-15 and ends on 2024/12/31.",
                                        flagsG: true, flagsI: false,
                                    },
                                    {
                                        label: "Capture groups",
                                        pattern: "(\\w+)\\s(\\w+)",
                                        test: "John Doe, Jane Smith, and Bob Wilson attended the meeting.",
                                        flagsG: true, flagsI: false,
                                    },
                                    {
                                        label: "Find URLs",
                                        pattern: "https?://[\\w\\-.]+\\.[a-z]{2,}[/\\w\\-.?=&#]*",
                                        test: "Visit https://example.com or http://docs.test.org/page?id=42 for info.",
                                        flagsG: true, flagsI: true,
                                    },
                                    {
                                        label: "Match hex colors",
                                        pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b",
                                        test: "Primary: #FF5733, secondary: #4a9, background: #1a1a2e, accent: #e94.",
                                        flagsG: true, flagsI: false,
                                    },
                                ].map((ex) => (
                                    <button
                                        key={ex.label}
                                        type="button"
                                        onClick={() => {
                                            setPattern(ex.pattern);
                                            setTestStr(ex.test);
                                            setFlagG(ex.flagsG);
                                            setFlagI(ex.flagsI);
                                        }}
                                        className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-500/10"
                                    >
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                            {ex.label}
                                        </span>
                                        <code className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                                            /{ex.pattern}/
                                        </code>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Regex input ── */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Regular Expression
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="flex flex-1 items-center rounded-xl border border-zinc-200 bg-white shadow-sm transition-colors focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:focus-within:border-indigo-500">
                                <span className="select-none pl-4 font-mono text-sm text-zinc-400 dark:text-zinc-500">
                                    /
                                </span>
                                <input
                                    ref={patternRef}
                                    type="text"
                                    value={pattern}
                                    onChange={(e) => setPattern(e.target.value)}
                                    placeholder="enter regex pattern…"
                                    spellCheck={false}
                                    className="flex-1 bg-transparent px-1 py-2.5 font-mono text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                                />
                                <span className="select-none pr-2 font-mono text-sm text-zinc-400 dark:text-zinc-500">
                                    /{flags}
                                </span>
                            </div>
                        </div>

                        {/* Flags */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mr-1">Flags:</span>
                            <div className="group relative mr-1">
                                <HelpCircle className="h-3.5 w-3.5 cursor-help text-zinc-400 transition-colors hover:text-indigo-500 dark:text-zinc-500 dark:hover:text-indigo-400" />
                                <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-3 opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 dark:border-zinc-700 dark:bg-zinc-800">
                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        Flag Reference
                                    </p>
                                    {FLAGS_INFO.map((fl) => (
                                        <div key={fl.flag} className="flex items-start gap-2 py-0.5">
                                            <code className="shrink-0 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                {fl.flag}
                                            </code>
                                            <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                                {fl.desc}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {FLAGS_INFO.map((f) => (
                                <button
                                    key={f.flag}
                                    type="button"
                                    onClick={() => flagSetters[f.flag](!flagGetters[f.flag])}
                                    className={`rounded-md border px-2.5 py-1 font-mono text-xs font-bold transition-all ${flagGetters[f.flag]
                                            ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-600/50 dark:bg-indigo-500/10 dark:text-indigo-400"
                                            : "border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-600"
                                        }`}
                                    title={f.desc}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Regex error */}
                        {regexError && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                {regexError}
                            </p>
                        )}
                    </div>

                    {/* ── Test string ── */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Test String
                        </label>
                        <div className="relative">
                            <textarea
                                value={testStr}
                                onChange={(e) => setTestStr(e.target.value)}
                                placeholder="Type or paste your test string here…"
                                rows={5}
                                spellCheck={false}
                                className="w-full resize-y rounded-xl border border-zinc-200 bg-white p-4 font-mono text-sm leading-relaxed text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* ── Highlighted output ── */}
                    {testStr && pattern && !regexError && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Highlighted Matches
                            </label>
                            <div className="rounded-xl border border-zinc-200 bg-white p-4 font-mono text-sm leading-relaxed shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
                                {segments.map((seg, i) =>
                                    seg.isMatch ? (
                                        <mark
                                            key={i}
                                            className={`rounded px-0.5 ${MATCH_COLORS[(seg.matchIdx ?? 0) % MATCH_COLORS.length]}`}
                                        >
                                            {seg.text}
                                        </mark>
                                    ) : (
                                        <span key={i} className="text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                                            {seg.text}
                                        </span>
                                    ),
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Match results ── */}
                    {matches.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                {matches.length} Match{matches.length !== 1 && "es"}
                            </label>
                            <div className="space-y-1">
                                {matches.map((m, i) => (
                                    <div
                                        key={i}
                                        className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-900/60"
                                    >
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                                #{i + 1}
                                            </span>
                                            <code className={`rounded px-1.5 py-0.5 font-mono text-sm text-zinc-900 dark:text-zinc-100 ${MATCH_COLORS[i % MATCH_COLORS.length]}`}>
                                                {m.fullMatch || <span className="italic text-zinc-400">(empty)</span>}
                                            </code>
                                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                                index {m.index} · length {m.length}
                                            </span>
                                        </div>
                                        {m.groups.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {m.groups.map((g, gi) => (
                                                    <span
                                                        key={gi}
                                                        className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
                                                    >
                                                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                                            ${gi + 1}
                                                        </span>
                                                        <code className="font-mono text-zinc-700 dark:text-zinc-300">
                                                            {g || <span className="italic text-zinc-400">(empty)</span>}
                                                        </code>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── No matches state ── */}
                    {pattern && testStr && !regexError && matches.length === 0 && (
                        <div className="rounded-xl border-2 border-dashed border-zinc-300 py-8 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                            No matches found — try adjusting the pattern or flags
                        </div>
                    )}

                    {/* ── Actions ── */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!pattern}
                            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4 text-emerald-500" /> Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4" /> Copy Regex
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={!pattern && !testStr}
                            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                        >
                            <Trash2 className="h-4 w-4" /> Clear
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowCheatSheet(!showCheatSheet)}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all active:scale-[0.97] ${showCheatSheet
                                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-600/50 dark:bg-indigo-500/10 dark:text-indigo-400"
                                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                                }`}
                        >
                            <Info className="h-4 w-4" /> Cheat Sheet
                        </button>
                    </div>

                    {/* ── Cheat sheet ── */}
                    {showCheatSheet && (
                        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
                            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Quick Reference — click to insert
                            </h3>
                            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
                                {CHEAT_SHEET.map((item) => (
                                    <button
                                        key={item.token}
                                        type="button"
                                        onClick={() => insertToken(item.token)}
                                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    >
                                        <code className="shrink-0 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                            {item.token}
                                        </code>
                                        <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                            {item.desc}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ================================================================ */}
            {/* GENERATOR TAB                                                   */}
            {/* ================================================================ */}
            {tab === "generator" && (
                <>
                    {/* ── Helper intro ── */}
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3 dark:border-indigo-500/20 dark:bg-indigo-500/5">
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            <strong>How it works:</strong> Describe what you want to match in plain English,
                            or click one of the suggestions below. The generator will find the best matching
                            regex pattern and explain each part.
                        </p>
                    </div>

                    {/* ── Input ── */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Describe the pattern you need
                        </label>
                        <textarea
                            value={genInput}
                            onChange={(e) => setGenInput(e.target.value)}
                            placeholder="e.g. 'match email addresses' or 'find all phone numbers'…"
                            rows={2}
                            className="w-full resize-none rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleGenerate();
                                }
                            }}
                        />
                    </div>

                    {/* ── Quick suggestions ── */}
                    <div className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Try a suggestion
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {[
                                "email address",
                                "URL",
                                "phone number",
                                "IP address",
                                "date",
                                "UUID",
                                "hex color",
                                "password",
                                "credit card",
                                "JWT token",
                                "semantic version",
                                "domain name",
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => {
                                        setGenInput(suggestion);
                                        setGenError("");
                                        const result = generateFromDescription(suggestion);
                                        if (result) setGenResult(result);
                                    }}
                                    className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={!genInput.trim()}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                        <Zap className="h-4 w-4" /> Generate Regex
                    </button>

                    {/* Error */}
                    {genError && (
                        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            {genError}
                        </p>
                    )}

                    {/* Generated result */}
                    {genResult && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        {genResult.name}
                                    </span>
                                    <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                                        flags: {genResult.flags || "none"}
                                    </span>
                                </div>

                                {/* Pattern display */}
                                <div className="rounded-lg bg-zinc-900 px-4 py-3 dark:bg-zinc-950">
                                    <code className="break-all font-mono text-sm text-indigo-300">
                                        /{genResult.regex}/{genResult.flags}
                                    </code>
                                </div>

                                {/* Explanation */}
                                <div className="mt-4 space-y-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                        Explanation
                                    </span>
                                    {genResult.explanation.map((line, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-2 rounded-md px-2 py-1 text-sm text-zinc-600 dark:text-zinc-400"
                                        >
                                            <span className="mt-0.5 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                                                {i + 1}.
                                            </span>
                                            <code className="font-mono text-xs leading-relaxed">
                                                {line}
                                            </code>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Use in Tester button */}
                            <button
                                type="button"
                                onClick={sendToTester}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.97] dark:bg-indigo-500 dark:hover:bg-indigo-600"
                            >
                                <ArrowRight className="h-4 w-4" /> Use in Tester
                            </button>
                        </div>
                    )}

                    {/* ── All available patterns ── */}
                    {!genResult && (
                        <div className="space-y-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                All Available Patterns
                            </span>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {[
                                    { label: "Email Address", keyword: "email" },
                                    { label: "URL", keyword: "url" },
                                    { label: "Phone (General)", keyword: "phone" },
                                    { label: "Phone (US)", keyword: "phone us" },
                                    { label: "Phone (India)", keyword: "phone india" },
                                    { label: "Phone (UK)", keyword: "phone uk" },
                                    { label: "Phone (International)", keyword: "phone international" },
                                    { label: "IPv4 Address", keyword: "ip address" },
                                    { label: "Date (YYYY-MM-DD)", keyword: "date" },
                                    { label: "Time (HH:MM)", keyword: "time" },
                                    { label: "UUID (v4)", keyword: "uuid" },
                                    { label: "Hex Color Code", keyword: "hex color" },
                                    { label: "Integer", keyword: "integer" },
                                    { label: "Decimal / Float", keyword: "decimal" },
                                    { label: "Word", keyword: "word" },
                                    { label: "Username", keyword: "username" },
                                    { label: "Strong Password", keyword: "strong password" },
                                    { label: "Credit Card", keyword: "credit card" },
                                    { label: "US ZIP Code", keyword: "zip code" },
                                    { label: "MAC Address", keyword: "mac address" },
                                    { label: "HTML Tag", keyword: "html tag" },
                                    { label: "Whitespace", keyword: "whitespace" },
                                    { label: "Line Break", keyword: "newline" },
                                    { label: "URL Slug", keyword: "slug" },
                                    { label: "Domain Name", keyword: "domain" },
                                    { label: "US SSN", keyword: "ssn" },
                                    { label: "JSON String", keyword: "json string" },
                                    { label: "CSV Field", keyword: "csv" },
                                    { label: "Markdown Link", keyword: "markdown link" },
                                    { label: "Hashtag", keyword: "hashtag" },
                                    { label: "@Mention", keyword: "mention" },
                                    { label: "Semantic Version", keyword: "semver" },
                                    { label: "Base64 String", keyword: "base64" },
                                    { label: "JWT Token", keyword: "jwt" },
                                ].map((p) => (
                                    <button
                                        key={p.keyword}
                                        type="button"
                                        onClick={() => {
                                            setGenInput(p.keyword);
                                            setGenError("");
                                            const result = generateFromDescription(p.keyword);
                                            if (result) setGenResult(result);
                                        }}
                                        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                                    >
                                        <Wand2 className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
