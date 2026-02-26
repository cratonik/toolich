"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Copy, Check, Trash2, Upload, Undo2 } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";

export default function Base64Encoder() {
    const [input, setInput] = useSessionState("base64-encode:input", "");
    const [output, setOutput] = useSessionState("base64-encode:output", "");
    const [copied, setCopied] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const undoRef = useRef<{ input: string; output: string } | null>(null);

    const encode = useCallback((text: string) => {
        if (!text) {
            setOutput("");
            return;
        }
        try {
            // Handle Unicode properly
            const bytes = new TextEncoder().encode(text);
            const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
            setOutput(btoa(binary));
        } catch {
            setOutput("⚠ Unable to encode input");
        }
    }, []);

    // Auto-copy output to clipboard on every change
    useEffect(() => {
        if (!output || output.startsWith("⚠")) return;
        navigator.clipboard.writeText(output).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }).catch(() => { });
    }, [output]);

    const handleInputChange = (value: string) => {
        setInput(value);
        setFileName(null);
        encode(value);
    };

    const handleFile = useCallback((file: File) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // result is a data URL like "data:...;base64,XXXXX"
            const base64 = result.split(",")[1] ?? "";
            setInput(`[File: ${file.name}]`);
            setOutput(base64);
        };
        reader.readAsDataURL(file);
    }, []);

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
            {/* Input / Output panels */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Input */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Input
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder="Type or paste text here…"
                        rows={12}
                        className="w-full resize-none rounded-xl border border-zinc-200 bg-white p-4 font-mono text-sm text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                    />
                </div>

                {/* Output */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Base64 Output
                    </label>
                    <textarea
                        value={output}
                        readOnly
                        placeholder="Encoded output appears here…"
                        rows={12}
                        className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm text-zinc-900 shadow-sm outline-none dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                </div>
            </div>

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
                        ? `Encoded: ${fileName}`
                        : "Drop a file here or click to upload"}
                </span>
                <input
                    ref={fileInputRef}
                    type="file"
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
