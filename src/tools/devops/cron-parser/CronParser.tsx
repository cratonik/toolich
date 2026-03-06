"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Trash2, Shuffle } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";
import cronstrue from "cronstrue";
import { CronExpressionParser } from "cron-parser";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FIELD_LABELS = ["minute", "hour", "day", "month", "weekday"] as const;

const RANDOM_EXPRESSIONS = [
    "*/15 * * * *",
    "0 9 * * *",
    "0 0 * * 0",
    "30 2 1 * *",
    "0 */2 * * *",
    "0 8-17 * * 1-5",
    "5 4 * * *",
    "0 0 1 1 *",
    "*/5 * * * *",
    "0 12 * * 1-5",
    "0 0 * * *",
    "15 10 * * 0,6",
    "0 6,18 * * *",
    "30 */4 * * *",
    "0 9 1,15 * *",
];

const SYNTAX_REF = [
    { symbol: "*", meaning: "any value" },
    { symbol: ",", meaning: "value list separator" },
    { symbol: "-", meaning: "range of values" },
    { symbol: "/", meaning: "step values" },
];

const SHORTCUTS = [
    { symbol: "@yearly", meaning: "(non-standard)" },
    { symbol: "@annually", meaning: "(non-standard)" },
    { symbol: "@monthly", meaning: "(non-standard)" },
    { symbol: "@weekly", meaning: "(non-standard)" },
    { symbol: "@daily", meaning: "(non-standard)" },
    { symbol: "@hourly", meaning: "(non-standard)" },
    { symbol: "@reboot", meaning: "(non-standard)" },
];

/** Map shortcut aliases to standard 5-field expressions */
function expandShortcut(expr: string): string {
    const map: Record<string, string> = {
        "@yearly": "0 0 1 1 *",
        "@annually": "0 0 1 1 *",
        "@monthly": "0 0 1 * *",
        "@weekly": "0 0 * * 0",
        "@daily": "0 0 * * *",
        "@midnight": "0 0 * * *",
        "@hourly": "0 * * * *",
    };
    return map[expr.trim().toLowerCase()] ?? expr;
}

type ParseResult = {
    description: string;
    error: string;
    nextRuns: string[];
    fields: string[];
};

function parseCron(expression: string): ParseResult {
    const expanded = expandShortcut(expression.trim());

    let description = "";
    let error = "";
    let nextRuns: string[] = [];
    const fields = expanded.split(/\s+/);

    // Validate field count (5 or 6 fields)
    if (
        fields.length < 5 ||
        fields.length > 6 ||
        expression.trim().toLowerCase() === "@reboot"
    ) {
        if (expression.trim().toLowerCase() === "@reboot") {
            return {
                description: "Run once at startup",
                error: "",
                nextRuns: [],
                fields: ["@reboot"],
            };
        }
        return {
            description: "",
            error:
                fields.length === 0
                    ? ""
                    : `Expected 5 or 6 fields, got ${fields.length}`,
            nextRuns: [],
            fields,
        };
    }

    try {
        description = cronstrue.toString(expanded, {
            use24HourTimeFormat: true,
            verbose: false,
        });
    } catch (e: unknown) {
        error = e instanceof Error ? e.message : "Invalid expression";
    }

    if (!error) {
        try {
            const interval = CronExpressionParser.parse(expanded);
            const runs: string[] = [];
            for (let i = 0; i < 10; i++) {
                const next = interval.next();
                const d = next.toDate();
                runs.push(
                    d.getFullYear() +
                    "-" +
                    String(d.getMonth() + 1).padStart(2, "0") +
                    "-" +
                    String(d.getDate()).padStart(2, "0") +
                    " " +
                    String(d.getHours()).padStart(2, "0") +
                    ":" +
                    String(d.getMinutes()).padStart(2, "0") +
                    ":" +
                    String(d.getSeconds()).padStart(2, "0"),
                );
            }
            nextRuns = runs;
        } catch {
            // silently ignore next-run errors
        }
    }

    return { description, error, nextRuns, fields };
}

const EMPTY_RESULT: ParseResult = { description: "", error: "", nextRuns: [], fields: [] };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CronParser() {
    const [expression, setExpression] = useSessionState(
        "cron-parser:expr",
        "5 4 * * *",
    );
    const [copied, setCopied] = useState(false);
    const [showAllRuns, setShowAllRuns] = useState(false);
    const [result, setResult] = useState<ParseResult>(EMPTY_RESULT);

    // Compute on client only (useEffect never runs during SSR) to avoid
    // hydration mismatch from time-dependent next-run timestamps.
    useEffect(() => {
        setResult(parseCron(expression));
    }, [expression]);

    const { description, error, nextRuns, fields } = result;

    const handleRandom = useCallback(() => {
        const next =
            RANDOM_EXPRESSIONS[
            Math.floor(Math.random() * RANDOM_EXPRESSIONS.length)
            ];
        setExpression(next);
    }, [setExpression]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(expression.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleClear = () => {
        setExpression("");
    };

    // How many fields to show labels for
    const fieldLabels =
        fields.length === 6
            ? (["second", ...FIELD_LABELS] as string[])
            : ([...FIELD_LABELS] as string[]);

    const displayedRuns = showAllRuns ? nextRuns : nextRuns.slice(0, 5);

    return (
        <div className="mx-auto max-w-2xl space-y-8">
            {/* ── Human-readable description ── */}
            <div className="text-center">
                {expression.trim() ? (
                    error ? (
                        <p className="font-mono text-lg font-semibold text-red-500 dark:text-red-400">
                            {error}
                        </p>
                    ) : (
                        <>
                            <p className="font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                                &ldquo;{description}&rdquo;
                            </p>
                            {nextRuns.length > 0 && (
                                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                        next
                                    </span>{" "}
                                    at {nextRuns[0]}
                                </p>
                            )}
                        </>
                    )
                ) : (
                    <p className="font-mono text-xl text-zinc-400 dark:text-zinc-500">
                        Enter a cron expression below
                    </p>
                )}
            </div>

            {/* ── Expression input box ── */}
            <div className="relative rounded-xl border-2 border-indigo-400 bg-zinc-900 p-4 shadow-lg shadow-indigo-500/10 dark:border-indigo-500 dark:bg-zinc-950">
                {/* Random button */}
                <button
                    type="button"
                    onClick={handleRandom}
                    className="absolute -top-3 right-20 rounded-md border border-zinc-600 bg-zinc-800 px-3 py-0.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
                >
                    random
                </button>

                {/* Copy button */}
                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!expression.trim()}
                    className="absolute -top-3 right-4 rounded-md border border-zinc-600 bg-zinc-800 px-3 py-0.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-40"
                >
                    {copied ? (
                        <span className="inline-flex items-center gap-1">
                            <Check className="h-3 w-3 text-emerald-400" /> Copied
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1">
                            <Copy className="h-3 w-3" /> Copy
                        </span>
                    )}
                </button>

                <input
                    type="text"
                    value={expression}
                    onChange={(e) => setExpression(e.target.value)}
                    placeholder="* * * * *"
                    className="w-full bg-transparent text-center font-mono text-3xl font-bold tracking-[0.3em] text-indigo-300 outline-none placeholder:text-zinc-600 sm:text-4xl"
                    spellCheck={false}
                />
            </div>

            {/* ── Field labels ── */}
            {expression.trim() && fields.length >= 5 && (
                <div className="flex justify-center">
                    <div
                        className="grid gap-1 text-center"
                        style={{
                            gridTemplateColumns: `repeat(${fieldLabels.length}, minmax(0, 1fr))`,
                            width: `${fieldLabels.length * 5}rem`,
                        }}
                    >
                        {fieldLabels.map((label) => (
                            <span
                                key={label}
                                className="text-xs font-medium text-indigo-500 dark:text-indigo-400"
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Actions ── */}
            <div className="flex justify-center gap-3">
                <button
                    type="button"
                    onClick={handleRandom}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600"
                >
                    <Shuffle className="h-4 w-4" /> Random
                </button>
                <button
                    type="button"
                    onClick={handleClear}
                    disabled={!expression}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600"
                >
                    <Trash2 className="h-4 w-4" /> Clear
                </button>
            </div>

            {/* ── Next run times ── */}
            {nextRuns.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Next Run Times
                    </h3>
                    <div className="space-y-1">
                        {displayedRuns.map((run, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                            >
                                <span className="w-6 text-right text-xs font-medium text-zinc-400 dark:text-zinc-500">
                                    {i + 1}.
                                </span>
                                <code className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                                    {run}
                                </code>
                            </div>
                        ))}
                    </div>
                    {nextRuns.length > 5 && (
                        <button
                            type="button"
                            onClick={() => setShowAllRuns(!showAllRuns)}
                            className="mt-2 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            {showAllRuns
                                ? "Show less"
                                : `Show all ${nextRuns.length} runs`}
                        </button>
                    )}
                </div>
            )}

            {/* ── Syntax reference ── */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
                <table className="w-full text-sm">
                    <tbody>
                        {SYNTAX_REF.map((row) => (
                            <tr
                                key={row.symbol}
                                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                            >
                                <td className="py-2 pr-6 text-right font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                    {row.symbol}
                                </td>
                                <td className="py-2 text-zinc-500 dark:text-zinc-400">
                                    {row.meaning}
                                </td>
                            </tr>
                        ))}
                        {/* Divider */}
                        <tr>
                            <td
                                colSpan={2}
                                className="py-1"
                            />
                        </tr>
                        {SHORTCUTS.map((row) => (
                            <tr
                                key={row.symbol}
                                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                            >
                                <td className="py-2 pr-6 text-right font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                    {row.symbol}
                                </td>
                                <td className="py-2 text-zinc-500 dark:text-zinc-400">
                                    {row.meaning}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
