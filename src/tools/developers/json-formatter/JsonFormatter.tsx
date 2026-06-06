"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Copy, Check, Trash2, Upload, WrapText, Minimize2, Undo2, ClipboardCopy, ListTree } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";

type IndentSize = 2 | 4;

// ── Relaxed JSON: wrap unquoted template vars ({{...}}) and identifiers so JSON.parse works ──
function normalizeRelaxedJson(input: string): string {
    const len = input.length;
    let i = 0;
    const out: string[] = [];

    while (i < len) {
        const c = input[i];

        // Whitespace
        if (/[\s\n\r\t]/.test(c)) {
            out.push(c);
            i++;
            continue;
        }

        // String literals (single or double quoted)
        if (c === '"' || c === "'") {
            const startQuote = c;
            let j = i + 1;
            let escaped = false;
            let strContent = "";

            while (j < len) {
                const sc = input[j];
                if (escaped) {
                    strContent += sc;
                    escaped = false;
                    j++;
                    continue;
                }
                if (sc === "\\") {
                    strContent += sc;
                    escaped = true;
                    j++;
                    continue;
                }
                if (sc === startQuote) {
                    j++;
                    break;
                }
                if (sc === "\n" || sc === "\r") {
                    // Line break terminates the unclosed string to allow recovery
                    break;
                }
                strContent += sc;
                j++;
            }

            // Output as double-quoted string
            // Escape double quotes inside the string content
            const normalizedContent = strContent.replace(/"/g, '\\"');
            out.push('"', normalizedContent, '"');
            i = j;
            continue;
        }

        // Template variables or unquoted words / identifiers
        // (e.g. fals, theme, verified, or {{VAR}})
        if (c === "{" && input[i + 1] === "{") {
            let j = i + 2;
            let content = "";
            while (j < len) {
                if (input[j] === "}" && input[j + 1] === "}") {
                    j += 2;
                    break;
                }
                content += input[j];
                j++;
            }
            out.push('"', `{{${content.trim()}}}`, '"');
            i = j;
            continue;
        }

        // If it is an identifier (unquoted key or unquoted value like fals)
        if (/[A-Za-z_$]/.test(c)) {
            let j = i;
            let word = "";
            while (j < len && /[A-Za-z0-9_$]/.test(input[j])) {
                word += input[j];
                j++;
            }
            
            if (word === "true" || word === "false" || word === "null") {
                out.push(word);
            } else {
                out.push('"', word, '"');
            }
            i = j;
            continue;
        }

        // Default: push other characters
        out.push(c);
        i++;
    }

    return out.join("");
}

// ── Structure-only format: only add/remove whitespace, never add/remove quotes or other chars ──
function prettifyStructureOnly(input: string, spaces: IndentSize): string {
    const len = input.length;
    let i = 0;
    const out: string[] = [];
    let inString = false;
    let stringQuote: string | null = null;
    let escapeNext = false;
    let inTemplate = false;
    let depth = 0;
    const indentStr = " ".repeat(spaces);

    function indent(d: number) {
        return indentStr.repeat(Math.max(0, d));
    }

    function needNewlineBefore(): boolean {
        const n = out.length;
        if (n === 0) return false;
        let j = n - 1;
        while (j >= 0 && /[\s\n\r\t]/.test(out[j])) j--;
        return j >= 0 && out[j] !== "\n";
    }

    while (i < len) {
        if (inString) {
            if (escapeNext) {
                escapeNext = false;
                out.push(input[i]);
                i++;
                continue;
            }
            if (input[i] === "\\") {
                escapeNext = true;
                out.push(input[i]);
                i++;
                continue;
            }
            if (input[i] === stringQuote) {
                inString = false;
                stringQuote = null;
                out.push(input[i]);
                i++;
                continue;
            }
            if (input[i] === "\n" || input[i] === "\r") {
                // Terminate unclosed string on newline to allow recovery
                inString = false;
                stringQuote = null;
                // do not continue, let it fall through to be processed as normal character
            } else {
                out.push(input[i]);
                i++;
                continue;
            }
        }

        if (inTemplate) {
            out.push(input[i]);
            if (input[i] === "}" && input[i + 1] === "}") {
                out.push(input[i + 1]);
                i += 2;
                inTemplate = false;
                continue;
            }
            i++;
            continue;
        }

        const c = input[i];

        if (c === '"' || c === "'") {
            inString = true;
            stringQuote = c;
            out.push(c);
            i++;
            continue;
        }

        if (c === "{" && input[i + 1] === "{") {
            inTemplate = true;
            out.push(c);
            i++;
            continue;
        }

        if (c === "{") {
            if (needNewlineBefore()) out.push("\n", indent(depth));
            out.push(c);
            depth++;
            out.push("\n", indent(depth));
            i++;
            continue;
        }
        if (c === "}") {
            depth--;
            out.push("\n", indent(Math.max(0, depth)), c);
            i++;
            continue;
        }
        if (c === "[") {
            if (needNewlineBefore()) out.push("\n", indent(depth));
            out.push(c);
            depth++;
            out.push("\n", indent(depth));
            i++;
            continue;
        }
        if (c === "]") {
            depth--;
            out.push("\n", indent(Math.max(0, depth)), c);
            i++;
            continue;
        }
        if (c === ",") {
            out.push(c, "\n", indent(depth));
            i++;
            continue;
        }
        if (c === ":") {
            out.push(c, " ");
            i++;
            continue;
        }

        if (/[\s\n\r\t]/.test(c)) {
            i++;
            continue;
        }

        out.push(c);
        i++;
    }

    return out.join("");
}

function minifyStructureOnly(input: string): string {
    const len = input.length;
    let i = 0;
    const out: string[] = [];
    let inString = false;
    let stringQuote: string | null = null;
    let escapeNext = false;
    let inTemplate = false;

    while (i < len) {
        if (inString) {
            if (escapeNext) {
                escapeNext = false;
                out.push(input[i]);
                i++;
                continue;
            }
            if (input[i] === "\\") {
                escapeNext = true;
                out.push(input[i]);
                i++;
                continue;
            }
            if (input[i] === stringQuote) {
                inString = false;
                stringQuote = null;
                out.push(input[i]);
                i++;
                continue;
            }
            if (input[i] === "\n" || input[i] === "\r") {
                // Terminate unclosed string on newline to allow recovery
                inString = false;
                stringQuote = null;
                // do not continue, let it fall through to be processed as normal character
            } else {
                out.push(input[i]);
                i++;
                continue;
            }
        }

        if (inTemplate) {
            out.push(input[i]);
            if (input[i] === "}" && input[i + 1] === "}") {
                out.push(input[i + 1]);
                i += 2;
                inTemplate = false;
                continue;
            }
            i++;
            continue;
        }

        const c = input[i];

        if (c === '"' || c === "'") {
            inString = true;
            stringQuote = c;
            out.push(c);
            i++;
            continue;
        }

        if (c === "{" && input[i + 1] === "{") {
            inTemplate = true;
            out.push(c);
            i++;
            continue;
        }

        if (/[\s\n\r\t]/.test(c)) {
            i++;
            continue;
        }

        out.push(c);
        i++;
    }

    return out.join("");
}

// ── Syntax highlighting ─────────────────────────────────────────────────────
type TokenType = "key" | "string" | "number" | "boolean" | "null" | "brace" | "plain";

function colorizeJson(text: string): { text: string; type: TokenType }[] {
    const tokens: { text: string; type: TokenType }[] = [];
    const regex = /(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*')\s*(:)|\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*'|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\],:\s]+/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
        // Add any skipped text
        if (match.index > lastIndex) {
            tokens.push({ text: text.slice(lastIndex, match.index), type: "plain" });
        }

        const full = match[0];

        if (match[1] && match[2]) {
            // Key: "key": or 'key':
            tokens.push({ text: match[1], type: "key" });
            tokens.push({ text: match[2], type: "plain" });
        } else if (full.startsWith('"') || full.startsWith("'")) {
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

// ── JSON tree view (stack.hu-style: triangle toggles, indented rows) ─────────

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function isObject(value: unknown): value is { [key: string]: JsonValue } {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is JsonValue[] {
    return Array.isArray(value);
}

const TREE_INDENT = 18; // px per depth level

// ── Portal tooltip for tree nodes (escapes overflow-auto) ───────────────────
function TreeTooltip({
    text,
    triggerRef,
    copied,
}: {
    text: string;
    triggerRef: React.RefObject<HTMLElement | null>;
    copied: boolean;
}) {
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = triggerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setPos({
            top: rect.top,
            left: rect.left + rect.width / 2,
        });
    }, [triggerRef]);

    // Adjust horizontal position so tooltip doesn't overflow viewport
    useEffect(() => {
        const tip = tooltipRef.current;
        if (!tip || !pos) return;
        const tipRect = tip.getBoundingClientRect();
        const overflow = tipRect.right - window.innerWidth + 8;
        if (overflow > 0) {
            setPos((prev) => prev ? { ...prev, left: prev.left - overflow } : prev);
        }
        const underflow = tipRect.left;
        if (underflow < 8) {
            setPos((prev) => prev ? { ...prev, left: prev.left + (8 - underflow) } : prev);
        }
    }, [pos]);

    if (!pos) return null;

    return createPortal(
        <div
            ref={tooltipRef}
            className="fixed z-[9999] pointer-events-none select-none"
            style={{
                top: pos.top - 6,
                left: pos.left,
                transform: "translate(-50%, -100%)",
            }}
        >
            <div className="rounded-lg border border-zinc-200 bg-white/95 px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-lg backdrop-blur-sm dark:border-zinc-600 dark:bg-zinc-800/95 dark:text-zinc-200 max-w-[400px] break-all">
                {copied ? (
                    <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Copied!
                    </span>
                ) : (
                    <>
                        <span>{text}</span>
                        <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">click to copy</span>
                    </>
                )}
            </div>
            {/* Arrow */}
            <div className="mx-auto h-0 w-0 border-x-[5px] border-t-[5px] border-x-transparent border-t-zinc-200 dark:border-t-zinc-600" style={{ width: 'fit-content', marginLeft: '50%', transform: 'translateX(-50%)' }} />
        </div>,
        document.body
    );
}

// ── Tooltip trigger wrapper ─────────────────────────────────────────────────
function TooltipTrigger({
    tooltipText,
    children,
    className,
}: {
    tooltipText: string;
    children: React.ReactNode;
    className?: string;
}) {
    const [show, setShow] = useState(false);
    const [copied, setCopied] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(tooltipText).then(() => {
            setCopied(true);
            setShow(true);
            setTimeout(() => {
                setCopied(false);
                setShow(false);
            }, 1200);
        });
    };

    return (
        <>
            <span
                ref={ref}
                className={`cursor-pointer ${className ?? ""}`}
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                onClick={handleClick}
            >
                {children}
            </span>
            {show && (
                <TreeTooltip
                    text={tooltipText}
                    triggerRef={ref}
                    copied={copied}
                />
            )}
        </>
    );
}

type JsonTreeNodeProps = {
    name?: string;
    index?: number;
    value: JsonValue;
    depth: number;
    path: string;
    isLast?: boolean;
};

function JsonTreeNode({ name, index, value, depth, path, isLast = true }: JsonTreeNodeProps) {
    const [collapsed, setCollapsed] = useState(depth > 0);
    const isCollapsible = isObject(value) || isArray(value);

    const toggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isCollapsible) setCollapsed((prev) => !prev);
    };

    const indentPx = depth * TREE_INDENT;
    const rowClass =
        "flex items-center gap-0.5 min-h-[22px] px-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/80 cursor-default";
    const comma = isLast ? "" : <span className={TOKEN_COLORS.plain}>,</span>;

    // Triangle toggle (stack.hu style)
    const Toggle = () =>
        isCollapsible ? (
            <button
                type="button"
                onClick={toggle}
                className="shrink-0 w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded"
                aria-label={collapsed ? "Expand" : "Collapse"}
            >
                <span className="text-[10px] leading-none">{collapsed ? "\u25B6" : "\u25BC"}</span>
            </button>
        ) : (
            <span className="w-4 shrink-0 inline-block" aria-hidden />
        );

    if (isObject(value)) {
        const entries = Object.entries(value);
        const rootLabel = depth === 0 ? <span className="text-zinc-500 dark:text-zinc-400">Object</span> : null;
        return (
            <div className="select-text">
                <div className={rowClass} style={{ marginLeft: indentPx }}>
                    <Toggle />
                    {name != null && (
                        <>
                            <TooltipTrigger tooltipText={path}>
                                <span className={TOKEN_COLORS.key}>&quot;{name}&quot;</span>
                            </TooltipTrigger>
                            <span className={TOKEN_COLORS.plain}>: </span>
                        </>
                    )}
                    {depth === 0 && rootLabel}
                    {depth === 0 && rootLabel && "\u00A0"}
                    <span className={TOKEN_COLORS.brace}>{"{"}</span>
                    {collapsed && entries.length > 0 && (
                        <span className="text-zinc-400 dark:text-zinc-500 text-xs">
                            {" "}
                            {entries.length} key{entries.length !== 1 ? "s" : ""}
                        </span>
                    )}
                    {collapsed && comma}
                </div>
                {!collapsed && entries.length > 0 && (
                    <>
                        {entries.map(([key, child], i) => (
                            <JsonTreeNode
                                key={key}
                                name={key}
                                value={child}
                                depth={depth + 1}
                                path={path ? `${path}.${key}` : key}
                                isLast={i === entries.length - 1}
                            />
                        ))}
                        <div className={rowClass} style={{ marginLeft: indentPx }}>
                            <span className="w-4 shrink-0" />
                            <span className={TOKEN_COLORS.brace}>{"}"}</span>
                            {!isLast && <span className={TOKEN_COLORS.plain}>,</span>}
                        </div>
                    </>
                )}
            </div>
        );
    }

    if (isArray(value)) {
        const len = value.length;
        const rootLabel = depth === 0 ? <span className="text-zinc-500 dark:text-zinc-400">Array</span> : null;
        return (
            <div className="select-text">
                <div className={rowClass} style={{ marginLeft: indentPx }}>
                    <Toggle />
                    {index !== undefined && (
                        <>
                            <TooltipTrigger tooltipText={path}>
                                <span className="text-zinc-500 dark:text-zinc-400">{index}</span>
                            </TooltipTrigger>
                            <span className={TOKEN_COLORS.plain}>: </span>
                        </>
                    )}
                    {name != null && (
                        <>
                            <TooltipTrigger tooltipText={path}>
                                <span className={TOKEN_COLORS.key}>&quot;{name}&quot;</span>
                            </TooltipTrigger>
                            <span className={TOKEN_COLORS.plain}>: </span>
                        </>
                    )}
                    {depth === 0 && rootLabel}
                    {depth === 0 && rootLabel && "\u00A0"}
                    <span className={TOKEN_COLORS.brace}>{"["}</span>
                    {collapsed && len > 0 && (
                        <span className="text-zinc-400 dark:text-zinc-500 text-xs">
                            {" "}
                            {len} item{len !== 1 ? "s" : ""}
                        </span>
                    )}
                    {collapsed && comma}
                </div>
                {!collapsed && len > 0 && (
                    <>
                        {value.map((child, i) => (
                            <JsonTreeNode
                                key={i}
                                index={i}
                                value={child}
                                depth={depth + 1}
                                path={`${path}[${i}]`}
                                isLast={i === len - 1}
                            />
                        ))}
                        <div className={rowClass} style={{ marginLeft: indentPx }}>
                            <span className="w-4 shrink-0" />
                            <span className={TOKEN_COLORS.brace}>{"]"}</span>
                            {!isLast && <span className={TOKEN_COLORS.plain}>,</span>}
                        </div>
                    </>
                )}
            </div>
        );
    }

    let primitiveDisplay: string;
    let primitiveClass: string;
    switch (typeof value) {
        case "string":
            primitiveDisplay = `"${value}"`;
            primitiveClass = TOKEN_COLORS.string;
            break;
        case "number":
            primitiveDisplay = String(value);
            primitiveClass = TOKEN_COLORS.number;
            break;
        case "boolean":
            primitiveDisplay = value ? "true" : "false";
            primitiveClass = TOKEN_COLORS.boolean;
            break;
        default:
            primitiveDisplay = "null";
            primitiveClass = TOKEN_COLORS.null;
    }

    return (
        <div className={rowClass} style={{ marginLeft: indentPx }}>
            <Toggle />
            {index !== undefined && (
                <>
                    <TooltipTrigger tooltipText={path}>
                        <span className="text-zinc-500 dark:text-zinc-400">{index}</span>
                    </TooltipTrigger>
                    <span className={TOKEN_COLORS.plain}>: </span>
                </>
            )}
            {name != null && (
                <>
                    <TooltipTrigger tooltipText={path}>
                        <span className={TOKEN_COLORS.key}>&quot;{name}&quot;</span>
                    </TooltipTrigger>
                    <span className={TOKEN_COLORS.plain}>: </span>
                </>
            )}
            <TooltipTrigger tooltipText={typeof value === "string" ? value : String(value)}>
                <span className={primitiveClass}>{primitiveDisplay}</span>
            </TooltipTrigger>
            {comma}
        </div>
    );
}

function JsonTree({ value }: { value: JsonValue }) {
    return (
        <div className="font-mono text-[13px] leading-snug text-zinc-800 dark:text-zinc-100 py-1">
            <JsonTreeNode value={value} depth={0} path="" />
        </div>
    );
}

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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLPreElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isPasteRef = useRef(false);
    const undoContentRef = useRef<string | null>(null);

    // Parse JSON (strict first, then relaxed so template vars like {{VAR}} work)
    const tryParseJson = useCallback((text: string): { parsed: JsonValue | null; normalized: string | null } => {
        if (!text.trim()) return { parsed: null, normalized: null };
        try {
            return { parsed: JSON.parse(text) as JsonValue, normalized: null };
        } catch {
            try {
                const normalized = normalizeRelaxedJson(text);
                return { parsed: JSON.parse(normalized) as JsonValue, normalized };
            } catch {
                return { parsed: null, normalized: null };
            }
        }
    }, []);

    const parsedJson = useMemo<JsonValue | null>(() => tryParseJson(content).parsed, [content, tryParseJson]);

    // Line count
    const lineCount = useMemo(() => {
        if (!content) return 1;
        return content.split("\n").length;
    }, [content]);

    // Syntax highlight tokens
    const highlightedHtml = useMemo(() => {
        if (!content) return "";
        try {
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
            return content
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }
    }, [content]);

    const prettify = useCallback(
        (text: string, spaces: IndentSize): string => {
            if (!text.trim()) {
                setError(null);
                return text;
            }
            const { parsed, normalized } = tryParseJson(text);
            if (parsed !== null) {
                setError(null);
                if (normalized !== null) {
                    return prettifyStructureOnly(text, spaces);
                }
                return JSON.stringify(parsed, null, spaces);
            }
            setError("Invalid JSON");
            return prettifyStructureOnly(text, spaces);
        },
        [tryParseJson]
    );

    // Flag paste — only auto-prettify when pasting into an empty editor or when
    // all text is selected (i.e. a full-content paste). Partial in-editor
    // copy-pastes should behave like normal text insertion.
    const handlePaste = useCallback(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        const { selectionStart, selectionEnd, value } = ta;
        const isEditorEmpty = value.trim() === "";
        const isAllSelected = selectionStart === 0 && selectionEnd === value.length;
        isPasteRef.current = isEditorEmpty || isAllSelected;
    }, []);

    // On change: if it was a paste, auto-prettify the full content
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;

        if (isPasteRef.current) {
            isPasteRef.current = false;
            const result = prettify(newValue, indent);
            setContent(result);
        } else {
            setContent(newValue);
            // Live validation — accept strict or relaxed (template vars) JSON
            if (!newValue.trim()) {
                setError(null);
            } else {
                const { parsed } = tryParseJson(newValue);
                setError(parsed !== null ? null : "Invalid JSON");
            }
        }
    };

    const handlePrettify = () => {
        const result = prettify(content, indent);
        setContent(result);
    };

    const handleMinify = () => {
        if (!content.trim()) return;
        const { parsed, normalized } = tryParseJson(content);
        if (parsed !== null) {
            setContent(normalized !== null ? minifyStructureOnly(content) : JSON.stringify(parsed));
            setError(null);
        } else {
            setContent(minifyStructureOnly(content));
            setError("Invalid JSON");
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
                setContent(result);
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
                                setContent(result);
                            }}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${indent === size
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
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${autoCopy
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

                {treeMode && parsedJson ? (
                    <div className="relative min-h-[200px] max-h-[70vh] overflow-auto rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900/90">
                        <JsonTree value={parsedJson} />
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
                                                if (e.key === "Tab") {
                                                    e.preventDefault();
                                                    const ta = e.currentTarget;
                                                    const start = ta.selectionStart;
                                                    const end = ta.selectionEnd;
                                                    const spaces = " ".repeat(indent);
                                                    const before = ta.value.slice(0, start);
                                                    const after = ta.value.slice(end);
                                                    const newValue = before + spaces + after;
                                                    setContent(newValue);
                                                    // Restore cursor position after the inserted spaces
                                                    requestAnimationFrame(() => {
                                                        ta.selectionStart = ta.selectionEnd = start + indent;
                                                    });
                                                } else if (e.key === "Escape") {
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
