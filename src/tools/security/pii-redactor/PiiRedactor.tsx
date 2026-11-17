"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import {
    Check,
    ClipboardCopy,
    Download,
    EyeOff,
    FileText,
    RotateCcw,
    ShieldCheck,
    Sparkles,
    Trash2,
    Upload,
} from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";
import { trackToolUsageEvent } from "@/lib/analytics";
import {
    DETECTORS,
    DETECTOR_BY_ID,
    redact,
    restore,
    type DetectorGroup,
    type DetectorId,
    type RedactionStyle,
} from "./redactor";

const TOOL = "pii-redactor";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const DEFAULT_ENABLED: DetectorId[] = DETECTORS.map((d) => d.id);

const STYLES: { id: RedactionStyle; label: string; example: string; hint: string }[] = [
    { id: "numbered", label: "Placeholders", example: "[EMAIL_1]", hint: "Same value → same placeholder. Can be restored later." },
    { id: "label", label: "Type labels", example: "[EMAIL]", hint: "Every match becomes its type." },
    { id: "mask", label: "Partial mask", example: "j***@e***.com", hint: "Keeps a hint of the value, e.g. last 4 card digits." },
    { id: "block", label: "Block", example: "████████", hint: "Fixed-width block that hides even the length." },
];

const GROUP_ORDER: DetectorGroup[] = ["Secrets", "Contact", "Financial", "Government IDs", "Network", "Custom"];

const GROUP_STYLE: Record<DetectorGroup, string> = {
    Secrets: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
    Contact: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
    Financial: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
    "Government IDs": "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
    Network: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
    Custom: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100",
};

const SAMPLE = `[2026-11-17 10:32:07] ERROR payment failed for order #48213
customer: Priya Sharma <priya.sharma@acme-corp.com>, phone +91 98765 43210
card: 4111 1111 1111 1111 (exp 08/28), billing IBAN GB82 WEST 1234 5698 7654 32
client_ip=203.0.113.42 session=fe80::1ff:fe23:4567:890a
Authorization: Bearer sk-proj-4fT9xQ2mWb7LkR8nZp3Vc6Ye
DB_URL=postgres://app_user:S3cretPass!@db.internal:5432/payments
retrying with api_key="AKIAIOSFODNN7EXAMPLE" for Project Falcon`;

const BTN =
    "inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700";
const LABEL = "text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400";
const PANEL =
    "w-full rounded-xl border border-zinc-200 bg-white p-4 font-mono text-[13px] leading-relaxed text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100";

function useCopy() {
    const [copied, setCopied] = useState<string | null>(null);
    const copy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(id);
            trackToolUsageEvent(TOOL, `copy_${id}`);
            setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
        } catch {
            // clipboard blocked
        }
    };
    return { copied, copy };
}

export default function PiiRedactor() {
    const [input, setInput] = useSessionState(`${TOOL}:input`, "");
    const [style, setStyle] = useSessionState<RedactionStyle>(`${TOOL}:style`, "numbered");
    const [enabled, setEnabled] = useSessionState<DetectorId[]>(`${TOOL}:enabled`, DEFAULT_ENABLED);
    const [termsText, setTermsText] = useSessionState(`${TOOL}:terms`, "");
    const [restoreInput, setRestoreInput] = useSessionState(`${TOOL}:restore`, "");
    const [fileError, setFileError] = useState("");
    const [showMapping, setShowMapping] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const { copied, copy } = useCopy();

    const customTerms = useMemo(
        () => termsText.split(/[\n,]/).map((t) => t.trim()).filter(Boolean),
        [termsText],
    );

    // Keep typing smooth on big inputs: redact the deferred value.
    const deferredInput = useDeferredValue(input);
    const result = useMemo(
        () => redact(deferredInput, { enabled, style, customTerms }),
        [deferredInput, enabled, style, customTerms],
    );
    const stale = deferredInput !== input;

    const restored = useMemo(
        () => (style === "numbered" && restoreInput ? restore(restoreInput, result.mapping) : null),
        [style, restoreInput, result.mapping],
    );

    const total = result.findings.length;
    const mappingEntries = Object.entries(result.mapping);
    const enabledSet = new Set(enabled);

    const toggle = (id: DetectorId) =>
        setEnabled((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));

    const openFile = (file: File | undefined) => {
        setFileError("");
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) {
            setFileError("File is larger than 5 MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setInput(String(reader.result ?? ""));
            trackToolUsageEvent(TOOL, "open_file");
        };
        reader.onerror = () => setFileError("Could not read that file.");
        reader.readAsText(file);
    };

    const download = () => {
        const blob = new Blob([result.output], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "redacted.txt";
        a.click();
        URL.revokeObjectURL(url);
        trackToolUsageEvent(TOOL, "download");
    };

    return (
        <div className="space-y-6">
            {/* Privacy note */}
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                    Everything runs in your browser. Your text is never uploaded, so it&apos;s safe to paste real logs,
                    emails and tickets here before sharing them with a vendor, colleague or AI tool.
                </span>
            </div>

            {/* Input / output */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={LABEL}>Original text</span>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" className={BTN} onClick={() => setInput(SAMPLE)}>
                                <Sparkles className="h-3.5 w-3.5" /> Sample
                            </button>
                            <button type="button" className={BTN} onClick={() => fileRef.current?.click()}>
                                <Upload className="h-3.5 w-3.5" /> Open file
                            </button>
                            <button type="button" className={BTN} onClick={() => setInput("")} disabled={!input}>
                                <Trash2 className="h-3.5 w-3.5" /> Clear
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".txt,.log,.csv,.json,.md,.yaml,.yml,.env,.xml,.tsv,text/*"
                                className="hidden"
                                onChange={(e) => {
                                    openFile(e.target.files?.[0]);
                                    e.target.value = "";
                                }}
                            />
                        </div>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            openFile(e.dataTransfer.files?.[0]);
                        }}
                        placeholder="Paste logs, emails, tickets or config… or drop a text file here."
                        spellCheck={false}
                        aria-label="Original text"
                        className={`${PANEL} h-80 resize-y outline-none placeholder:font-sans placeholder:text-zinc-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 dark:placeholder:text-zinc-500`}
                    />
                    {fileError && <p className="text-xs text-red-600 dark:text-red-400">{fileError}</p>}
                </div>

                <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={LABEL}>
                            Redacted text{" "}
                            {input && (
                                <span className="normal-case tracking-normal text-zinc-400">
                                    · {total} {total === 1 ? "item" : "items"} hidden
                                </span>
                            )}
                        </span>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" className={BTN} onClick={() => copy(result.output, "output")} disabled={!input}>
                                {copied === "output" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                                {copied === "output" ? "Copied" : "Copy"}
                            </button>
                            <button type="button" className={BTN} onClick={download} disabled={!input}>
                                <Download className="h-3.5 w-3.5" /> Download
                            </button>
                        </div>
                    </div>
                    <div
                        aria-label="Redacted text"
                        className={`${PANEL} h-80 overflow-auto whitespace-pre-wrap break-words transition-opacity ${stale ? "opacity-60" : ""}`}
                    >
                        {input ? (
                            result.segments.map((seg, i) =>
                                seg.type ? (
                                    <mark
                                        key={i}
                                        title={DETECTOR_BY_ID[seg.type].label}
                                        className={`rounded px-0.5 ${GROUP_STYLE[DETECTOR_BY_ID[seg.type].group]}`}
                                    >
                                        {seg.text}
                                    </mark>
                                ) : (
                                    <span key={i}>{seg.text}</span>
                                ),
                            )
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-2 font-sans text-sm text-zinc-400 dark:text-zinc-500">
                                <EyeOff className="h-7 w-7 opacity-40" />
                                The redacted version appears here.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Redaction style */}
            <div className="space-y-2">
                <span className={LABEL}>Redaction style</span>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {STYLES.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => setStyle(s.id)}
                            aria-pressed={style === s.id}
                            className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                                style === s.id
                                    ? "border-rose-300 bg-rose-50 ring-2 ring-rose-500/20 dark:border-rose-500/50 dark:bg-rose-500/10"
                                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:border-zinc-600"
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{s.label}</span>
                                <code className="truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{s.example}</code>
                            </div>
                            <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{s.hint}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Detectors */}
            <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={LABEL}>What to redact</span>
                    <div className="flex gap-2">
                        <button type="button" className={BTN} onClick={() => setEnabled(DEFAULT_ENABLED)}>
                            Select all
                        </button>
                        <button type="button" className={BTN} onClick={() => setEnabled([])}>
                            Clear all
                        </button>
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {GROUP_ORDER.map((group) => (
                        <div key={group} className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{group}</div>
                            <div className="space-y-1">
                                {DETECTORS.filter((d) => d.group === group).map((d) => {
                                    const count = result.counts[d.id] ?? 0;
                                    return (
                                        <label
                                            key={d.id}
                                            title={`e.g. ${d.example}`}
                                            className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={enabledSet.has(d.id)}
                                                onChange={() => toggle(d.id)}
                                                className="h-3.5 w-3.5 accent-rose-600"
                                            />
                                            <span className="flex-1">{d.label}</span>
                                            {count > 0 && (
                                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${GROUP_STYLE[group]}`}>{count}</span>
                                            )}
                                        </label>
                                    );
                                })}
                                {group === "Custom" && enabledSet.has("custom") && (
                                    <textarea
                                        value={termsText}
                                        onChange={(e) => setTermsText(e.target.value)}
                                        placeholder="Names, company, project… (comma or one per line)"
                                        rows={2}
                                        aria-label="Custom terms to redact"
                                        className="mt-1 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Restore originals (placeholder style only) */}
            {style === "numbered" && input && (
                <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                <RotateCcw className="h-4 w-4 text-rose-500" /> Restore originals
                            </div>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                Got a reply that mentions <code className="font-mono">[EMAIL_1]</code>? Paste it here to put the real values back.
                            </p>
                        </div>
                        {mappingEntries.length > 0 && (
                            <button type="button" className={BTN} onClick={() => setShowMapping((v) => !v)} aria-expanded={showMapping}>
                                <FileText className="h-3.5 w-3.5" /> {showMapping ? "Hide" : "Show"} mapping ({mappingEntries.length})
                            </button>
                        )}
                    </div>

                    {showMapping && (
                        <div className="max-h-56 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                            <table className="w-full text-left text-xs">
                                <thead className="sticky top-0 bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">Placeholder</th>
                                        <th className="px-3 py-2 font-medium">Original value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 font-mono dark:divide-zinc-800">
                                    {mappingEntries.map(([ph, original]) => (
                                        <tr key={ph}>
                                            <td className="whitespace-nowrap px-3 py-1.5 text-rose-600 dark:text-rose-400">{ph}</td>
                                            <td className="break-all px-3 py-1.5 text-zinc-700 dark:text-zinc-300">{original}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <textarea
                            value={restoreInput}
                            onChange={(e) => setRestoreInput(e.target.value)}
                            placeholder="Paste text containing placeholders, e.g. “Please email [EMAIL_1] about [CARD_1]”"
                            rows={5}
                            spellCheck={false}
                            aria-label="Text with placeholders"
                            className={`${PANEL} resize-y outline-none placeholder:font-sans placeholder:text-zinc-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20`}
                        />
                        <div className="relative">
                            <div aria-label="Restored text" className={`${PANEL} h-full min-h-[8.5rem] whitespace-pre-wrap break-words`}>
                                {restored ? (
                                    restored.output
                                ) : (
                                    <span className="font-sans text-sm text-zinc-400 dark:text-zinc-500">Restored text appears here.</span>
                                )}
                            </div>
                            {restored && (
                                <div className="absolute right-2 top-2 flex items-center gap-2">
                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{restored.restored} restored</span>
                                    <button
                                        type="button"
                                        className={BTN}
                                        onClick={() => {
                                            copy(restored.output, "restored");
                                            trackToolUsageEvent(TOOL, "restore");
                                        }}
                                    >
                                        {copied === "restored" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                                        {copied === "restored" ? "Copied" : "Copy"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        The mapping is rebuilt from your original text and stays in this browser tab only.
                    </p>
                </div>
            )}

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Detection uses patterns and checksums, so it can miss unusual formats or flag look-alikes. Give the redacted text a quick read before sharing.
            </p>
        </div>
    );
}
