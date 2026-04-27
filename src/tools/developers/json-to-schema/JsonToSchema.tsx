"use client";

import { useState, useMemo } from "react";
import { Copy, Check, Trash2, ArrowRight, AlertCircle } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";
import { inferSchema } from "./schema-inferrer";

const DEFAULT_SAMPLE = JSON.stringify(
    {
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        name: "Toolich",
        version: "1.0.0",
        active: true,
        tags: ["developer", "tools", "productivity"],
    },
    null,
    2,
);

export default function JsonToSchema() {
    // ---- persisted state ----
    const [input, setInput] = useSessionState("j2s:input", DEFAULT_SAMPLE);

    // ---- transient state ----
    const [copied, setCopied] = useState(false);

    // ---- inference ----
    const { schema, error } = useMemo(() => {
        const trimmed = input.trim();
        if (!trimmed) return { schema: "", error: "" };

        try {
            const parsed = JSON.parse(trimmed);
            const result = inferSchema(parsed);
            return {
                schema: JSON.stringify(result, null, 2),
                error: "",
            };
        } catch (e) {
            return {
                schema: "",
                error: e instanceof Error ? e.message : "Invalid JSON",
            };
        }
    }, [input]);

    // ---- actions ----
    const handleCopy = async () => {
        if (!schema) return;
        await navigator.clipboard.writeText(schema);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleClear = () => {
        setInput("");
    };

    const handleSample = () => {
        setInput(
            JSON.stringify(
                {
                    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
                    name: "Toolich",
                    version: "1.0.0",
                    active: true,
                    tags: ["developer", "tools", "productivity"],
                },
            ),
        );
    };

    return (
        <div className="space-y-6">
            {/* ── Input / Output split ── */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* LEFT — JSON Input */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            JSON Input
                        </label>
                        {!input.trim() && (
                            <button
                                type="button"
                                onClick={handleSample}
                                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-500 transition-all hover:border-indigo-300 hover:text-indigo-600 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-600/50 dark:hover:text-indigo-400"
                            >
                                Load Sample
                            </button>
                        )}
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder='{\n  "name": "example",\n  "value": 42\n}'
                        rows={20}
                        spellCheck={false}
                        className="w-full resize-y rounded-xl border border-zinc-200 bg-white p-4 font-mono text-sm leading-relaxed text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                    />
                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-500/10">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                            <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                {error}
                            </p>
                        </div>
                    )}
                </div>

                {/* RIGHT — Schema Output */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Generated JSON Schema
                        </label>
                        {schema && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                <ArrowRight className="h-3 w-3" />
                                draft-07
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <textarea
                            value={schema}
                            readOnly
                            placeholder="Schema will appear here…"
                            rows={20}
                            spellCheck={false}
                            className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm leading-relaxed text-zinc-900 shadow-sm outline-none dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                        />
                    </div>
                </div>
            </div>

            {/* ── Actions ── */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!schema}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    {copied ? (
                        <>
                            <Check className="h-4 w-4 text-emerald-500" /> Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="h-4 w-4" /> Copy Schema
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
        </div>
    );
}
