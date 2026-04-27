"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Copy, Check, Trash2, AlertTriangle, Upload, Undo2, ClipboardCopy } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";

export default function Base64Decoder() {
    const [input, setInput] = useSessionState("base64-decode:input", "");
    const [output, setOutput] = useSessionState("base64-decode:output", "");
    const [autoCopy, setAutoCopy] = useSessionState("base64-decode:autocopy", false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const undoRef = useRef<{ input: string; output: string } | null>(null);

    const decode = useCallback((text: string) => {
        if (!text.trim()) {
            setOutput("");
            setError(null);
            return;
        }
        try {
            const binary = atob(text.trim());
            const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
            const decoded = new TextDecoder().decode(bytes);
            setOutput(decoded);
            setError(null);
        } catch {
            setOutput("");
            setError("Invalid Base64 string. Please check your input.");
        }
    }, []);

    // Auto-copy output to clipboard when enabled
    useEffect(() => {
        if (!autoCopy || !output) return;
        navigator.clipboard.writeText(output).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }).catch(() => { });
    }, [autoCopy, output]);

    const handleInputChange = (value: string) => {
        setInput(value);
        setFileName(null);
        decode(value);
    };

    const handleFile = useCallback(
        (file: File) => {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result as string;
                setInput(text.trim());
                decode(text.trim());
            };
            reader.readAsText(file);
        },
        [decode],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile],
    );

    const handleCopy = async () => {
        if (!output) return;
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleClear = () => {
        undoRef.current = { input, output };
        setInput("");
        setOutput("");
        setError(null);
        setFileName(null);
    };

    const handleUndo = () => {
        if (undoRef.current) {
            setInput(undoRef.current.input);
            setOutput(undoRef.current.output);
            undoRef.current = null;
        }
    };

    // Ctrl+Z after clear to undo
    useEffect(() => {
        if (!undoRef.current) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "z" && !input && !output) {
                e.preventDefault();
                handleUndo();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [input, output]);

    return (
        <div className="space-y-6">
            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!output}
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
                            Copy
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleClear}
                    disabled={!input && !output}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    <Trash2 className="h-4 w-4" />
                    Clear
                </button>

                <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

                <button
                    type="button"
                    onClick={() => setAutoCopy(!autoCopy)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        autoCopy
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-600/50 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                    }`}
                    title={autoCopy ? "Auto-copy is ON" : "Auto-copy is OFF"}
                >
                    <ClipboardCopy className="h-3.5 w-3.5" />
                    Auto-copy {autoCopy ? "ON" : "OFF"}
                </button>

                {/* Undo button (visible right after clear) */}
                {!input && !output && undoRef.current !== null && (
                    <button
                        type="button"
                        onClick={handleUndo}
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-100 active:scale-[0.97] dark:border-amber-600/50 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:border-amber-500 dark:hover:bg-amber-500/20"
                    >
                        <Undo2 className="h-4 w-4" />
                        Undo
                    </button>
                )}
            </div>
            {/* Input / Output panels */}
            <div className="grid gap-6 md:grid-cols-1">
                {/* Input */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Base64 Input
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder="Paste your Base64 string here…"
                        rows={12}
                        className={`w-full resize-none rounded-xl border p-4 font-mono text-sm shadow-sm outline-none transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${error
                            ? "border-red-300 bg-red-50/50 text-red-900 focus:border-red-400 focus:ring-2 focus:ring-red-500/20 dark:border-red-500/50 dark:bg-red-500/5 dark:text-red-200"
                            : "border-zinc-200 bg-white text-zinc-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                            }`}
                    />
                    {/* Error message */}
                    {error && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Output */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Decoded Output
                    </label>
                    <textarea
                        value={output}
                        readOnly
                        placeholder="Decoded text appears here…"
                        rows={12}
                        className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm text-zinc-900 shadow-sm outline-none dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                </div>
            </div>

            

            {/* File drop zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 text-sm transition-colors ${dragActive
                    ? "border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-500/10"
                    : "border-zinc-300 bg-zinc-50/50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/30 dark:hover:border-zinc-600"
                    }`}
            >
                <Upload
                    className={`h-5 w-5 ${dragActive ? "text-indigo-500" : "text-zinc-400 dark:text-zinc-500"}`}
                />
                <span className="text-zinc-500 dark:text-zinc-400">
                    {fileName
                        ? `Loaded: ${fileName}`
                        : "Drop a file containing Base64 text, or click to upload"}
                </span>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.b64,.base64"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                    }}
                />
            </div>
        </div>
    );
}
