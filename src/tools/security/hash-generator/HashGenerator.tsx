"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, Check, Trash2, Layers } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";
import {
    ALGORITHM_FAMILIES,
    ALL_ALGORITHM_IDS,
    computeHash,
} from "./hash-algorithms";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HashGenerator() {
    const [input, setInput] = useSessionState("hash-gen:input", "");
    const [uppercase, setUppercase] = useSessionState("hash-gen:uppercase", false);
    const [hashes, setHashes] = useState<Record<string, string>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);

    // Debounce ref for real-time hashing
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const computeIdRef = useRef(0);

    // ------ real-time hash computation (all algorithms) ------
    const computeAll = useCallback(async (text: string) => {
        const id = ++computeIdRef.current;
        if (!text) {
            setHashes({});
            return;
        }
        const results: Record<string, string> = {};
        const promises = ALL_ALGORITHM_IDS.map(async (alg) => {
            try {
                results[alg] = await computeHash(alg, text);
            } catch {
                results[alg] = "Error";
            }
        });
        await Promise.all(promises);
        if (id === computeIdRef.current) setHashes(results);
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => computeAll(input), 100);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [input, computeAll]);

    // ------ formatting ------
    const fmt = (hash: string) =>
        uppercase ? hash.toUpperCase() : hash.toLowerCase();

    // ------ algorithm label lookup ------
    const labelOf = (id: string): string =>
        ALGORITHM_FAMILIES.flatMap((f) => f.algorithms).find((a) => a.id === id)
            ?.label ?? id;

    // ------ clipboard ------
    const copyOne = async (id: string) => {
        const val = hashes[id];
        if (!val) return;
        await navigator.clipboard.writeText(fmt(val));
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    const copyAll = async () => {
        const lines = ALL_ALGORITHM_IDS.filter((id) => hashes[id])
            .map((id) => `${labelOf(id)}: ${fmt(hashes[id])}`)
            .join("\n");
        await navigator.clipboard.writeText(lines);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 1500);
    };

    const handleClear = () => {
        setInput("");
        setHashes({});
    };

    const hasResults = input.length > 0;

    return (
        <div className="space-y-6">
            {/* ── Input area ── */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Input Text
                </label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type or paste text to hash…"
                    rows={4}
                    className="w-full resize-none rounded-xl border border-zinc-200 bg-white p-4 font-mono text-sm text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                />
            </div>

            {/* ── Action bar ── */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={() => setUppercase(!uppercase)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${uppercase
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-600/50 dark:bg-indigo-500/10 dark:text-indigo-400"
                            : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                        }`}
                >
                    {uppercase ? "UPPERCASE" : "lowercase"}
                </button>

                <button
                    type="button"
                    onClick={copyAll}
                    disabled={!hasResults}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
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

                <button
                    type="button"
                    onClick={handleClear}
                    disabled={!input}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    <Trash2 className="h-4 w-4" /> Clear
                </button>
            </div>

            {/* ── Hash results — two column grid grouped by family ── */}
            {hasResults ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {ALGORITHM_FAMILIES.map((family) => (
                        <div key={family.name} className="space-y-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                {family.name}
                            </span>
                            <div className="space-y-1">
                                {family.algorithms.map((alg) => (
                                    <button
                                        key={alg.id}
                                        type="button"
                                        onClick={() => copyOne(alg.id)}
                                        className="group flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 active:scale-[0.995] dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/5"
                                        title={`Click to copy ${alg.label} hash`}
                                    >
                                        <span className="w-20 shrink-0 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                                            {alg.label}
                                        </span>
                                        <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-900 dark:text-zinc-100">
                                            {hashes[alg.id]
                                                ? fmt(hashes[alg.id])
                                                : "…"}
                                        </code>
                                        <span className="shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-500">
                                            {copiedId === alg.id ? (
                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5" />
                                            )}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 py-16 text-sm text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                    <Layers className="h-8 w-8 opacity-40" />
                    <span>Type text above to generate hashes</span>
                </div>
            )}
        </div>
    );
}
