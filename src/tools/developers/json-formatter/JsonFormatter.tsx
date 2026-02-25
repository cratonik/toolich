"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Copy, Check, Trash2, Upload, WrapText, Minimize2 } from "lucide-react";

type IndentSize = 2 | 4;

export default function JsonFormatter() {
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [indent, setIndent] = useState<IndentSize>(2);
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isPasteRef = useRef(false);

    const prettify = useCallback(
        (text: string, spaces: IndentSize): string | null => {
            if (!text.trim()) return text;
            try {
                const parsed = JSON.parse(text);
                return JSON.stringify(parsed, null, spaces);
            } catch (e) {
                setError(
                    e instanceof SyntaxError
                        ? e.message.replace("JSON.parse: ", "")
                        : "Invalid JSON"
                );
                return null;
            }
        },
        []
    );

    // Flag paste — let the browser handle it natively so undo works
    const handlePaste = useCallback(() => {
        isPasteRef.current = true;
    }, []);

    // On change: if it was a paste, auto-prettify the full content
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;

        if (isPasteRef.current) {
            isPasteRef.current = false;
            const result = prettify(newValue, indent);
            if (result !== null) {
                setContent(result);
                setError(null);
            } else {
                setContent(newValue);
            }
        } else {
            setContent(newValue);
            setError(null);
        }
    };

    const handlePrettify = () => {
        const result = prettify(content, indent);
        if (result !== null) {
            setContent(result);
            setError(null);
        }
    };

    const handleMinify = () => {
        if (!content.trim()) return;
        try {
            const parsed = JSON.parse(content);
            setContent(JSON.stringify(parsed));
            setError(null);
        } catch (e) {
            setError(
                e instanceof SyntaxError
                    ? e.message.replace("JSON.parse: ", "")
                    : "Invalid JSON"
            );
        }
    };

    // Auto-copy on every content change (when it's valid JSON)
    useEffect(() => {
        if (!content.trim()) return;
        try {
            JSON.parse(content);
            navigator.clipboard
                .writeText(content)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                })
                .catch(() => { });
        } catch {
            /* don't auto-copy invalid JSON */
        }
    }, [content]);

    const handleCopy = async () => {
        if (!content) return;
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleClear = () => {
        setContent("");
        setError(null);
        setFileName(null);
    };

    const handleFile = useCallback(
        (file: File) => {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result as string;
                const result = prettify(text, indent);
                if (result !== null) {
                    setContent(result);
                    setError(null);
                } else {
                    setContent(text);
                }
            };
            reader.readAsText(file);
        },
        [prettify, indent]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    return (
        <div className="space-y-5">
            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Indent selector */}
                <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                    {([2, 4] as IndentSize[]).map((size) => (
                        <button
                            key={size}
                            type="button"
                            onClick={() => setIndent(size)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${indent === size
                                ? "bg-indigo-500 text-white shadow-sm"
                                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                                }`}
                        >
                            {size} spaces
                        </button>
                    ))}
                </div>

                <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

                <button
                    type="button"
                    onClick={handlePrettify}
                    disabled={!content}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    <WrapText className="h-4 w-4" />
                    Prettify
                </button>

                <button
                    type="button"
                    onClick={handleMinify}
                    disabled={!content}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    <Minimize2 className="h-4 w-4" />
                    Minify
                </button>

                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!content}
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
                    disabled={!content}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    <Trash2 className="h-4 w-4" />
                    Clear
                </button>
            </div>

            {/* Textarea */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    JSON
                </label>
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleChange}
                    onPaste={handlePaste}
                    placeholder='Paste JSON to auto-format, or type and hit "Prettify"…'
                    rows={24}
                    spellCheck={false}
                    className={`w-full rounded-xl border p-4 font-mono text-[13px] leading-relaxed shadow-sm outline-none transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${error
                        ? "border-red-300 bg-red-50/50 text-red-900 focus:border-red-400 focus:ring-2 focus:ring-red-500/20 dark:border-red-500/50 dark:bg-red-500/5 dark:text-red-200"
                        : "border-zinc-200 bg-white text-zinc-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                        }`}
                />
                {/* Error message */}
                {error && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        <span className="mt-px shrink-0">⚠</span>
                        {error}
                    </div>
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
                    className={`h-5 w-5 ${dragActive
                        ? "text-indigo-500"
                        : "text-zinc-400 dark:text-zinc-500"
                        }`}
                />
                <span className="text-zinc-500 dark:text-zinc-400">
                    {fileName
                        ? `Loaded: ${fileName}`
                        : "Drop a JSON file here or click to upload"}
                </span>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.txt"
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
