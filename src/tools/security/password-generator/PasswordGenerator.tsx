"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
    Copy,
    Check,
    Trash2,
    RefreshCw,
    ShieldCheck,
    ShieldAlert,
    ShieldOff,
    Shield,
    Layers,
    Eye,
    EyeOff,
} from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";

// ---------------------------------------------------------------------------
// Character sets
// ---------------------------------------------------------------------------

const CHAR_SETS = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    digits: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:',.<>?/`~\"\\",
} as const;

const AMBIGUOUS_CHARS = "0O1lI|";

// ---------------------------------------------------------------------------
// Strength helpers
// ---------------------------------------------------------------------------

type StrengthLevel = "none" | "weak" | "fair" | "strong" | "very-strong";

function calcEntropy(poolSize: number, length: number): number {
    if (poolSize <= 0 || length <= 0) return 0;
    return Math.floor(length * Math.log2(poolSize));
}

function strengthLevel(entropy: number): StrengthLevel {
    if (entropy === 0) return "none";
    if (entropy < 36) return "weak";
    if (entropy < 60) return "fair";
    if (entropy < 100) return "strong";
    return "very-strong";
}

const STRENGTH_META: Record<
    StrengthLevel,
    { label: string; color: string; bg: string; percent: number; icon: typeof Shield }
> = {
    none: {
        label: "—",
        color: "text-zinc-400 dark:text-zinc-500",
        bg: "bg-zinc-300 dark:bg-zinc-700",
        percent: 0,
        icon: ShieldOff,
    },
    weak: {
        label: "Weak",
        color: "text-red-500",
        bg: "bg-red-500",
        percent: 25,
        icon: ShieldOff,
    },
    fair: {
        label: "Fair",
        color: "text-amber-500",
        bg: "bg-amber-500",
        percent: 50,
        icon: ShieldAlert,
    },
    strong: {
        label: "Strong",
        color: "text-emerald-500",
        bg: "bg-emerald-500",
        percent: 75,
        icon: Shield,
    },
    "very-strong": {
        label: "Very Strong",
        color: "text-indigo-500",
        bg: "bg-indigo-500",
        percent: 100,
        icon: ShieldCheck,
    },
};

// ---------------------------------------------------------------------------
// Secure random helpers
// ---------------------------------------------------------------------------

function secureRandomIndex(max: number): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
}

function generatePassword(pool: string, length: number): string {
    let result = "";
    for (let i = 0; i < length; i++) {
        result += pool[secureRandomIndex(pool.length)];
    }
    return result;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PasswordGenerator() {
    // ---- persisted settings ----
    const [length, setLength] = useSessionState("pw-gen:length", 16);
    const [useUpper, setUseUpper] = useSessionState("pw-gen:upper", true);
    const [useLower, setUseLower] = useSessionState("pw-gen:lower", true);
    const [useDigits, setUseDigits] = useSessionState("pw-gen:digits", true);
    const [useSymbols, setUseSymbols] = useSessionState("pw-gen:symbols", true);
    const [excludeAmbiguous, setExcludeAmbiguous] = useSessionState(
        "pw-gen:excludeAmbiguous",
        false,
    );
    const [customExclude, setCustomExclude] = useSessionState("pw-gen:customExclude", "");
    const [bulkCount, setBulkCount] = useSessionState("pw-gen:bulkCount", 1);

    // ---- transient state ----
    const [passwords, setPasswords] = useState<string[]>([]);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);
    const [visible, setVisible] = useState(true);

    // ---- character pool ----
    const pool = useMemo(() => {
        let chars = "";
        if (useUpper) chars += CHAR_SETS.uppercase;
        if (useLower) chars += CHAR_SETS.lowercase;
        if (useDigits) chars += CHAR_SETS.digits;
        if (useSymbols) chars += CHAR_SETS.symbols;
        if (excludeAmbiguous) {
            chars = chars
                .split("")
                .filter((c) => !AMBIGUOUS_CHARS.includes(c))
                .join("");
        }
        if (customExclude) {
            const excluded = new Set(customExclude.split(""));
            chars = chars
                .split("")
                .filter((c) => !excluded.has(c))
                .join("");
        }
        return chars;
    }, [useUpper, useLower, useDigits, useSymbols, excludeAmbiguous, customExclude]);

    const entropy = calcEntropy(pool.length, length);
    const strength = strengthLevel(entropy);
    const meta = STRENGTH_META[strength];
    const StrengthIcon = meta.icon;

    // ---- actions ----
    const handleGenerate = useCallback(() => {
        if (!pool) return;
        const count = Math.max(1, Math.min(50, bulkCount));
        setPasswords(Array.from({ length: count }, () => generatePassword(pool, length)));
    }, [pool, length, bulkCount]);

    // Generate on mount / settings change
    useEffect(() => {
        handleGenerate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pool, length]);

    const copyOne = async (idx: number) => {
        await navigator.clipboard.writeText(passwords[idx]);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 1500);
    };

    const copyAll = async () => {
        await navigator.clipboard.writeText(passwords.join("\n"));
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 1500);
    };

    const handleClear = () => {
        setPasswords([]);
    };

    const noCharset = pool.length === 0;

    // ---- toggle helper ----
    const Toggle = ({
        label,
        checked,
        onChange,
    }: {
        label: string;
        checked: boolean;
        onChange: (v: boolean) => void;
    }) => (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                checked
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-600/50 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            {/* ── Length slider ── */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Password Length:{" "}
                    <span className="text-zinc-900 dark:text-zinc-100">{length}</span>
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min={4}
                        max={128}
                        value={length}
                        onChange={(e) => setLength(Number(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-indigo-500 dark:bg-zinc-700"
                    />
                    <input
                        type="number"
                        min={4}
                        max={128}
                        value={length}
                        onChange={(e) => {
                            const v = Math.max(4, Math.min(128, Number(e.target.value)));
                            setLength(v);
                        }}
                        className="w-16 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-center font-mono text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* ── Character set toggles ── */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Character Sets
                </label>
                <div className="flex flex-wrap gap-2">
                    <Toggle label="A–Z" checked={useUpper} onChange={setUseUpper} />
                    <Toggle label="a–z" checked={useLower} onChange={setUseLower} />
                    <Toggle label="0–9" checked={useDigits} onChange={setUseDigits} />
                    <Toggle label="!@#$%…" checked={useSymbols} onChange={setUseSymbols} />
                    <Toggle
                        label="Exclude Ambiguous (0O1lI)"
                        checked={excludeAmbiguous}
                        onChange={setExcludeAmbiguous}
                    />
                </div>
            </div>

            {/* ── Custom exclude ── */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Custom Excluded Characters
                </label>
                <input
                    type="text"
                    value={customExclude}
                    onChange={(e) => setCustomExclude(e.target.value)}
                    placeholder="e.g. {}[]"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 font-mono text-sm text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                />
            </div>

            {/* ── Bulk count ── */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Count
                </label>
                <input
                    type="number"
                    min={1}
                    max={50}
                    value={bulkCount}
                    onChange={(e) =>
                        setBulkCount(Math.max(1, Math.min(50, Number(e.target.value))))
                    }
                    className="w-20 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-center font-mono text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:focus:border-indigo-500"
                />
            </div>

            {/* ── Strength meter ── */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <StrengthIcon className={`h-4 w-4 ${meta.color}`} />
                        <span className={`text-xs font-semibold ${meta.color}`}>
                            {meta.label}
                        </span>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                        {entropy > 0 ? `${entropy} bits of entropy` : "—"}
                    </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${meta.bg}`}
                        style={{ width: `${meta.percent}%` }}
                    />
                </div>
            </div>

            {/* ── Action bar ── */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={noCharset}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                    <RefreshCw className="h-4 w-4" /> Generate
                </button>

                <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    {visible ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                    {visible ? "Hide" : "Show"}
                </button>

                {passwords.length > 1 && (
                    <button
                        type="button"
                        onClick={copyAll}
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                    >
                        {copiedAll ? (
                            <>
                                <Check className="h-4 w-4 text-emerald-500" /> Copied All!
                            </>
                        ) : (
                            <>
                                <Layers className="h-4 w-4" /> Copy All
                            </>
                        )}
                    </button>
                )}

                <button
                    type="button"
                    onClick={handleClear}
                    disabled={passwords.length === 0}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    <Trash2 className="h-4 w-4" /> Clear
                </button>
            </div>

            {/* ── No charset warning ── */}
            {noCharset && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-600/40 dark:bg-amber-500/10 dark:text-amber-300">
                    Enable at least one character set to generate passwords.
                </div>
            )}

            {/* ── Password output ── */}
            {passwords.length > 0 ? (
                <div className="space-y-1">
                    {passwords.map((pw, idx) => (
                        <button
                            key={`${idx}-${pw}`}
                            type="button"
                            onClick={() => copyOne(idx)}
                            className="group flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 active:scale-[0.995] dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/5"
                            title="Click to copy"
                        >
                            {passwords.length > 1 && (
                                <span className="w-6 shrink-0 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
                                    {idx + 1}
                                </span>
                            )}
                            <code
                                className={`min-w-0 flex-1 break-all font-mono text-sm ${
                                    visible
                                        ? "text-zinc-900 dark:text-zinc-100"
                                        : "select-none blur-sm transition-[filter] group-hover:blur-none"
                                }`}
                            >
                                {pw}
                            </code>
                            <span className="shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-500">
                                {copiedIdx === idx ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                            </span>
                        </button>
                    ))}
                </div>
            ) : (
                !noCharset && (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 py-16 text-sm text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                        <RefreshCw className="h-8 w-8 opacity-40" />
                        <span>Click Generate above to create passwords</span>
                    </div>
                )
            )}

            {/* ── Pool info ── */}
            {pool.length > 0 && (
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Character pool size: <span className="font-mono">{pool.length}</span>
                </p>
            )}
        </div>
    );
}
