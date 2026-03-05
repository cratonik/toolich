"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Copy, Check, Trash2, Upload, WrapText, Minimize2, Undo2, ClipboardCopy, ListTree } from "lucide-react";
import { JsonViewer } from "@textea/json-viewer";
import { useSessionState } from "@/lib/use-session-state";

type IndentSize = 2 | 4;

// ── Syntax highlighting ─────────────────────────────────────────────────────
type TokenType = "key" | "string" | "number" | "boolean" | "null" | "brace" | "plain";

function colorizeJson(text: string): { text: string; type: TokenType }[] {
    const tokens: { text: string; type: TokenType }[] = [];
    const regex = /(\"(?:[^\"\\]|\\.)*\")\s*(:)|\"(?:[^\"\\]|\\.)*\"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\],:\s]+/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
        // Add any skipped text
        if (match.index > lastIndex) {
            tokens.push({ text: text.slice(lastIndex, match.index), type: "plain" });
        }

        const full = match[0];

        if (match[1] && match[2]) {
            // Key: "key":
            tokens.push({ text: match[1], type: "key" });
            tokens.push({ text: match[2], type: "plain" });
        } else if (full.startsWith('"')) {
            tokens.push({ text: full, type: "string" });
        } else if (/^-?\d/.test(full)) {
            tokens.push({ text: full, type: "number" });
        } else if (full === "true" || full === "false") {
            tokens.push({ text: full, type: "boolean" });
        } else if (full === "null") {
            tokens.push({ text: full, type: "null" });
        } else if (/^[{}\[\]]$/.test(full.trim())) {
            tokens.push({ text: full, type: "brace" });
        } else {
            tokens.push({ text: full, type: "plain" });
        }

        lastIndex = match.index + full.length;
    }

    if (lastIndex < text.length) {
        tokens.push({ text: text.slice(lastIndex), type: "plain" });
    }

    return tokens;
}

const TOKEN_COLORS: Record<TokenType, string> = {
    key: "text-indigo-600 dark:text-indigo-400",
    string: "text-emerald-600 dark:text-emerald-400",
    number: "text-amber-600 dark:text-amber-400",
    boolean: "text-rose-500 dark:text-rose-400",
    null: "text-zinc-400 dark:text-zinc-500",
    brace: "text-zinc-500 dark:text-zinc-400",
    plain: "text-zinc-700 dark:text-zinc-300",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function JsonFormatter() {
    const [content, setContent] = useSessionState("json-formatter:content", "");
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [indent, setIndent] = useSessionState<IndentSize>("json-formatter:indent", 2);
    const [autoCopy, setAutoCopy] = useSessionState("json-formatter:autocopy", false);
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [showTree, setShowTree] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLPreElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isPasteRef = useRef(false);
    const undoContentRef = useRef<string | null>(null);

    // Parsed JSON for tree view (only when valid)
    const parsedJson = useMemo<unknown | null>(() => {
        if (!content.trim()) return null;
        try {
            return JSON.parse(content);
        } catch {
            return null;
        }
    }, [content]);

    // Track system dark mode for JsonViewer theming
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");

        const update = () => {
            setIsDark(mq.matches);
        };

        update();

        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // Line count
    const lineCount = useMemo(() => {
        if (!content) return 1;
        return content.split("\n").length;
    }, [content]);

    // Syntax highlight tokens
    const highlightedHtml = useMemo(() => {
        if (!content) return "";
        try {
            JSON.parse(content); // only highlight valid JSON
            const tokens = colorizeJson(content);
            return tokens
                .map((t) => {
                    const escaped = t.text
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                    return `<span class="${TOKEN_COLORS[t.type]}">${escaped}</span>`;
                })
                .join("");
        } catch {
            // Invalid JSON — no highlighting, just escape text
            return content
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }
    }, [content]);



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
            // Live validation — show error without prettifying
            if (!newValue.trim()) {
                setError(null);
            } else {
                try {
                    JSON.parse(newValue);
                    setError(null);
                } catch (e) {
                    setError(
                        e instanceof SyntaxError
                            ? e.message.replace("JSON.parse: ", "")
                            : "Invalid JSON"
                    );
                }
            }
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

    // Auto-copy on every content change (when enabled and valid JSON)
    useEffect(() => {
        if (!autoCopy || !content.trim()) return;
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
    }, [content, autoCopy]);

    const handleCopy = async () => {
        if (!content) return;
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleClear = () => {
        undoContentRef.current = content;
        setContent("");
        setError(null);
        setFileName(null);
    };

    const handleUndo = () => {
        if (undoContentRef.current !== null) {
            setContent(undoContentRef.current);
            undoContentRef.current = null;
        }
    };

    // Ctrl+Z after clear to undo
    useEffect(() => {
        if (undoContentRef.current === null) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "z" && !content) {
                e.preventDefault();
                handleUndo();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [content]);

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

    const treeMode = showTree && !!parsedJson;

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
                            disabled={treeMode}
                            onClick={() => {
                                setIndent(size);
                                const result = prettify(content, size);
                                if (result !== null) {
                                    setContent(result);
                                    setError(null);
                                }
                            }}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                                indent === size
                                    ? "bg-indigo-500 text-white shadow-sm"
                                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                            } ${treeMode ? "cursor-not-allowed opacity-40 hover:bg-inherit dark:hover:bg-inherit" : ""}`}
                        >
                            {size} spaces
                        </button>
                    ))}
                </div>

                <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

                <button
                    type="button"
                    onClick={handlePrettify}
                    disabled={!content || treeMode}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                    <WrapText className="h-4 w-4" />
                    Prettify
                </button>

                <button
                    type="button"
                    onClick={handleMinify}
                    disabled={!content || treeMode}
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

                {/* Undo button (visible right after clear) */}
                {!content && undoContentRef.current !== null && (
                    <button
                        type="button"
                        onClick={handleUndo}
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-100 active:scale-[0.97] dark:border-amber-600/50 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:border-amber-500 dark:hover:bg-amber-500/20"
                    >
                        <Undo2 className="h-4 w-4" />
                        Undo
                    </button>
                )}

                <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

                {/* Auto-copy toggle */}
                <button
                    type="button"
                    onClick={() => setAutoCopy(!autoCopy)}
                    disabled={treeMode}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        autoCopy
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-600/50 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                    } ${treeMode ? "cursor-not-allowed opacity-40 hover:bg-inherit dark:hover:bg-inherit" : ""}`}
                    title={autoCopy ? "Auto-copy is ON" : "Auto-copy is OFF"}
                >
                    <ClipboardCopy className="h-3.5 w-3.5" />
                    Auto-copy {autoCopy ? "ON" : "OFF"}
                </button>

                {/* Tree view toggle */}
                <button
                    type="button"
                    onClick={() => setShowTree((prev) => !prev)}
                    disabled={!parsedJson}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 ${showTree
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                        }`}
                >
                    <ListTree className="h-3.5 w-3.5" />
                    {showTree ? "Hide tree view" : "Show tree view"}
                </button>
            </div>

            {/* Editor / tree area (single panel to avoid scrolling) */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {treeMode ? "Tree view" : "JSON"}
                </label>

                {treeMode ? (
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900/80">
                        <JsonViewer
                            value={parsedJson}
                            rootName={false}
                            displayDataTypes={false}
                            defaultInspectDepth={2}
                            enableClipboard={false}
                            theme={isDark ? "dark" : "light"}
                            style={{
                                backgroundColor: "transparent",
                                fontSize: 13,
                                color: isDark ? "#e5e5e5" : "#111827",
                                lineHeight: 1.6,
                            }}
                        />
                    </div>
                ) : (
                    <>
                        <div
                            className={`relative overflow-hidden rounded-xl border shadow-sm transition-colors ${error
                                ? "border-red-300 dark:border-red-500/50"
                                : "border-zinc-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-zinc-700 dark:focus-within:border-indigo-500 dark:focus-within:ring-indigo-500/20"
                                }`}
                        >
                            {/* Single scroll container for gutter + editor */}
                            <div
                                ref={scrollContainerRef}
                                className={`flex min-h-[300px] max-h-[70vh] overflow-auto ${error
                                    ? "bg-red-50/50 dark:bg-red-500/5"
                                    : "bg-white dark:bg-zinc-900"
                                    }`}
                            >
                                {/* Line numbers gutter */}
                                <div
                                    className="shrink-0 self-start select-none border-r border-zinc-100 bg-zinc-100 py-4 pr-3 pl-3 text-right font-mono text-[13px] leading-relaxed text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-600"
                                    aria-hidden="true"
                                >
                                    {Array.from({ length: lineCount }, (_, i) => (
                                        <div key={i}>{i + 1}</div>
                                    ))}
                                </div>

                                {/* Editor area (textarea + highlight overlay) */}
                                <div className="flex-1 self-start">
                                    {/* Grid overlay: pre + textarea share the same cell */}
                                    <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
                                        {/* Syntax highlight layer (behind textarea) */}
                                        <pre
                                            ref={highlightRef}
                                            className="pointer-events-none whitespace-pre p-4 font-mono text-[13px] leading-relaxed"
                                            aria-hidden="true"
                                            dangerouslySetInnerHTML={{
                                                __html: highlightedHtml || "&nbsp;",
                                            }}
                                        />

                                        {/* Transparent textarea (on top for editing) */}
                                        <textarea
                                            ref={textareaRef}
                                            value={content}
                                            onChange={handleChange}
                                            onPaste={handlePaste}
                                            onKeyDown={(e) => {
                                                if (e.key === "Escape") {
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                            placeholder='Paste JSON to auto-format, or type and hit "Prettify"…'
                                            wrap="off"
                                            spellCheck={false}
                                            className={`relative z-10 block w-full min-h-[200px] resize-none whitespace-pre bg-transparent p-4 font-mono text-[13px] leading-relaxed outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${content
                                                ? "text-transparent caret-zinc-800 dark:caret-zinc-200"
                                                : "text-zinc-900 dark:text-zinc-100"
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                <span className="mt-px shrink-0">⚠</span>
                                {error}
                            </div>
                        )}
                    </>
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
