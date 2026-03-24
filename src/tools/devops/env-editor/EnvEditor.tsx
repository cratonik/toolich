"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
    Copy,
    Check,
    Trash2,
    Plus,
    ArrowUpDown,
    FileText,
    Table2,
    Download,
    AlertTriangle,
    ChevronDown,
} from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";
import {
    parseEnv,
    serializeEnv,
    serializeJSON,
    serializeYAML,
    findDuplicates,
    type EnvEntry,
} from "./env-parser";

// ---------------------------------------------------------------------------
// Sample content
// ---------------------------------------------------------------------------

const SAMPLE = "";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type ViewMode = "raw" | "table";
type ExportFormat = "env" | "json" | "yaml";

function ExportDropdown({
    onExport,
}: {
    onExport: (fmt: ExportFormat) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
            >
                <Download className="h-4 w-4" /> Export <ChevronDown className="h-3 w-3" />
            </button>
            {open && (
                <div className="absolute left-0 z-20 mt-1 w-36 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                    {(["env", "json", "yaml"] as ExportFormat[]).map((fmt) => (
                        <button
                            key={fmt}
                            type="button"
                            onClick={() => {
                                onExport(fmt);
                                setOpen(false);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                            {fmt === "env" ? ".env" : fmt.toUpperCase()}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function EnvEditor() {
    const [raw, setRaw] = useSessionState("env-editor:raw", SAMPLE);
    const [view, setView] = useState<ViewMode>("raw");
    const [sorted, setSorted] = useState(false);
    const [copied, setCopied] = useState(false);
    const [exportCopied, setExportCopied] = useState<string | null>(null);

    // Editing state — track which cell is being edited: "key" or "value"
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [editField, setEditField] = useState<"key" | "value">("key");
    const [editText, setEditText] = useState("");

    // New variable inputs
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");

    // ---- parsed entries ----
    const entries = useMemo(() => parseEnv(raw), [raw]);
    const duplicates = useMemo(() => findDuplicates(entries), [entries]);

    // ---- variable-only entries for table ----
    const varEntries = useMemo(() => {
        const indexed = entries
            .map((e, i) => ({ ...e, originalIdx: i }))
            .filter((e) => !e.isComment && !e.isBlank && e.key);
        if (sorted) {
            return [...indexed].sort((a, b) =>
                a.key.localeCompare(b.key, undefined, { sensitivity: "base" }),
            );
        }
        return indexed;
    }, [entries, sorted]);

    // ---- sync table changes back to raw ----
    const updateEntry = useCallback(
        (originalIdx: number, patch: Partial<EnvEntry>) => {
            const updated = entries.map((e, i) =>
                i === originalIdx ? { ...e, ...patch } : e,
            );
            setRaw(serializeEnv(updated));
        },
        [entries, setRaw],
    );

    const deleteEntry = useCallback(
        (originalIdx: number) => {
            const updated = entries.filter((_, i) => i !== originalIdx);
            setRaw(serializeEnv(updated));
        },
        [entries, setRaw],
    );

    const addEntry = useCallback(() => {
        const k = newKey.trim();
        if (!k) return;
        const newEntries: EnvEntry[] = [
            ...entries,
            { key: k, value: newValue, comment: "", isComment: false, isBlank: false },
        ];
        setRaw(serializeEnv(newEntries));
        setNewKey("");
        setNewValue("");
    }, [entries, newKey, newValue, setRaw]);

    // ---- inline cell edit helpers ----
    const startCellEdit = (idx: number, field: "key" | "value", currentValue: string) => {
        setEditIdx(idx);
        setEditField(field);
        setEditText(currentValue);
    };

    const saveCellEdit = () => {
        if (editIdx === null) return;
        updateEntry(editIdx, { [editField]: editField === "key" ? editText.trim() : editText });
        setEditIdx(null);
    };

    const cancelCellEdit = () => setEditIdx(null);

    const handleCellKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            saveCellEdit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            cancelCellEdit();
        }
    };

    // ---- clipboard ----
    const handleCopy = async () => {
        await navigator.clipboard.writeText(raw);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleExport = async (fmt: ExportFormat) => {
        let output = "";
        switch (fmt) {
            case "env":
                output = serializeEnv(entries);
                break;
            case "json":
                output = serializeJSON(entries);
                break;
            case "yaml":
                output = serializeYAML(entries);
                break;
        }
        await navigator.clipboard.writeText(output);
        setExportCopied(fmt);
        setTimeout(() => setExportCopied(null), 1500);
    };

    const handleClear = () => {
        setRaw("");
        setEditIdx(null);
    };

    const varCount = varEntries.length;
    const dupeCount = duplicates.size;

    return (
        <div className="space-y-6">
            {/* ── View toggle & stats ── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Segmented control */}
                <div className="inline-flex rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                    {(["raw", "table"] as ViewMode[]).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setView(m)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all first:rounded-l-lg last:rounded-r-lg ${view === m
                                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                                }`}
                        >
                            {m === "raw" ? (
                                <FileText className="h-3.5 w-3.5" />
                            ) : (
                                <Table2 className="h-3.5 w-3.5" />
                            )}
                            {m === "raw" ? "Raw" : "Table"}
                        </button>
                    ))}
                </div>

                {/* Stats pills */}
                <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {varCount} variable{varCount !== 1 && "s"}
                    </span>
                    {dupeCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            {dupeCount} duplicate{dupeCount !== 1 && "s"}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Raw view ── */}
            {view === "raw" && (
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        .env Content
                    </label>
                    <textarea
                        value={raw}
                        onChange={(e) => setRaw(e.target.value)}
                        placeholder="Paste your .env content here…"
                        rows={16}
                        spellCheck={false}
                        className="w-full resize-y rounded-xl border border-zinc-200 bg-white p-4 font-mono text-sm leading-relaxed text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                    />
                </div>
            )}

            {/* ── Table view ── */}
            {view === "table" && (
                <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-700">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_1.5fr_auto] gap-px bg-zinc-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        <span>Key</span>
                        <span>Value</span>
                        <span className="text-right">Actions</span>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900/60">
                        {varEntries.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
                                No variables — paste content in Raw view or add below
                            </div>
                        )}
                        {varEntries.map((entry) => {
                            const isDupe = duplicates.has(entry.key);
                            const isEditingKey = editIdx === entry.originalIdx && editField === "key";
                            const isEditingValue = editIdx === entry.originalIdx && editField === "value";

                            return (
                                <div
                                    key={entry.originalIdx}
                                    className="group grid grid-cols-[1fr_1.5fr_auto] items-center gap-2 px-4 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                                >
                                    {/* Key cell */}
                                    <div className="flex items-center gap-2 min-w-0">
                                        {isEditingKey ? (
                                            <input
                                                type="text"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                onKeyDown={handleCellKeyDown}
                                                onBlur={saveCellEdit}
                                                autoFocus
                                                className="w-full rounded-md border border-indigo-300 bg-white px-2 py-0.5 font-mono text-sm font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-indigo-600 dark:bg-zinc-900 dark:text-zinc-100"
                                            />
                                        ) : (
                                            <code
                                                className="truncate cursor-pointer rounded px-1 py-0.5 font-mono text-sm font-semibold text-zinc-900 transition-colors hover:bg-indigo-50 dark:text-zinc-100 dark:hover:bg-indigo-500/10"
                                                onDoubleClick={() => startCellEdit(entry.originalIdx, "key", entry.key)}
                                                title="Double-click to edit"
                                            >
                                                {entry.key}
                                            </code>
                                        )}
                                        {isDupe && (
                                            <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                                <AlertTriangle className="h-2.5 w-2.5" /> dup
                                            </span>
                                        )}
                                    </div>

                                    {/* Value cell */}
                                    {isEditingValue ? (
                                        <input
                                            type="text"
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            onKeyDown={handleCellKeyDown}
                                            onBlur={saveCellEdit}
                                            autoFocus
                                            className="w-full rounded-md border border-indigo-300 bg-white px-2 py-0.5 font-mono text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-indigo-600 dark:bg-zinc-900 dark:text-zinc-100"
                                        />
                                    ) : (
                                        <code
                                            className="truncate cursor-pointer rounded px-1 py-0.5 font-mono text-sm text-zinc-600 transition-colors hover:bg-indigo-50 dark:text-zinc-400 dark:hover:bg-indigo-500/10"
                                            onDoubleClick={() => startCellEdit(entry.originalIdx, "value", entry.value)}
                                            title="Double-click to edit"
                                        >
                                            {entry.value || <span className="italic text-zinc-300 dark:text-zinc-600">(empty)</span>}
                                        </code>
                                    )}

                                    {/* Actions — only delete */}
                                    <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button
                                            type="button"
                                            onClick={() => deleteEntry(entry.originalIdx)}
                                            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add row */}
                        <div className="grid grid-cols-[1fr_1.5fr_auto] items-center gap-2 px-4 py-2 bg-zinc-50/50 dark:bg-zinc-800/20">
                            <input
                                type="text"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                placeholder="NEW_KEY"
                                className="rounded-md border border-zinc-200 bg-white px-2 py-1 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") addEntry();
                                }}
                            />
                            <input
                                type="text"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                placeholder="value"
                                className="rounded-md border border-zinc-200 bg-white px-2 py-1 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") addEntry();
                                }}
                            />
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={addEntry}
                                    disabled={!newKey.trim()}
                                    className="rounded-md p-1.5 text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-40 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                                    title="Add variable"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Action bar ── */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={() => setSorted(!sorted)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all active:scale-[0.97] ${sorted
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-600/50 dark:bg-indigo-500/10 dark:text-indigo-400"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                        }`}
                >
                    <ArrowUpDown className="h-4 w-4" /> Sort A–Z
                </button>

                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!raw}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    {copied ? (
                        <>
                            <Check className="h-4 w-4 text-emerald-500" /> Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="h-4 w-4" /> Copy Raw
                        </>
                    )}
                </button>

                <ExportDropdown onExport={handleExport} />
                {exportCopied && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3 w-3" />{" "}
                        {exportCopied === "env" ? ".env" : exportCopied.toUpperCase()} copied!
                    </span>
                )}

                <button
                    type="button"
                    onClick={handleClear}
                    disabled={!raw}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    <Trash2 className="h-4 w-4" /> Clear
                </button>
            </div>
        </div>
    );
}
