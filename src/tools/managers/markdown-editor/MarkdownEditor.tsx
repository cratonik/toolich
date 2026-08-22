"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSessionState } from "@/lib/use-session-state";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { 
    Bold, Italic, Heading, Link, Image, Code, List, ListOrdered, CheckSquare, 
    FileText, Copy, Trash2, Eye, Edit3, Columns, ArrowDownToLine, Check, HelpCircle,
    Printer
} from "lucide-react";

// Default markdown content showing off features
const DEFAULT_MARKDOWN = `# 📝 Advanced Markdown Editor & Preview

Welcome to the **Toolich Markdown Editor**! This is a state-of-the-art editor that features:

* **Live Split-pane Preview** (Responsive stack on mobile)
* **Real-time Syntax Highlighting** in the editor
* **Mermaid.js Graphs & Flowcharts**
* **Interactive Checklist Toggles**
* **HTML & Raw Markdown Export**

---

## 📊 Live Graphs (Mermaid)

You can write charts and graphs natively using \` \` \`mermaid\` (without spaces) code blocks:

\`\`\`mermaid
graph TD
    A[Write Markdown] --> B(Live Preview)
    B --> C{Render Graphs?}
    C -->|Yes| D[Beautiful SVGs]
    C -->|No| E[Plain Text Code]
\`\`\`

Or sequence diagrams:

\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: Great, thanks!
\`\`\`

---

## 📋 Task Lists (Try clicking checkboxes in preview!)

- [x] Create a premium Markdown Editor
- [x] Add syntax highlighting
- [ ] Write some documentation
- [ ] Export to HTML

---

## 📐 Formatting & GFM Features

### Strikethrough

This is a ~~strikethrough text~~.

### Blockquotes

> "The advance tool this should be." - Master Yoda

### Tables

| Feature | Support | Performance |
| :--- | :---: | ---: |
| Split View | Yes | 60 FPS |
| Mermaid Diagrams | Yes | Dynamic |
| Export HTML | Yes | Instant |

---

## 💻 Code Highlighting

Here is some inline code like \`const x = 42;\`. And here is a fenced JS block:

\`\`\`javascript
function greet(name) {
    console.log(\`Hello, \${name}!\`);
}
greet("World");
\`\`\`
`;

// Helper to highlight Markdown syntax in the editor without affecting character widths or adding spacing
function highlightMarkdown(text: string): string {
    // 1. Escape HTML first
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // 2. Process line-by-line block elements
    const lines = html.split("\n");
    const highlightedLines = lines.map((line) => {
        // Headings (# Header)
        if (/^(#{1,6})(\s+)(.*)$/.test(line)) {
            return line.replace(/^(#{1,6})(\s+)(.*)$/, (match, hashes, spaces, content) => {
                return `<span class="text-indigo-600 dark:text-indigo-400">${hashes}${spaces}${content}</span>`;
            });
        }
        // Blockquotes (> quote)
        if (/^(\s*&gt;\s+)(.*)$/.test(line)) {
            return line.replace(/^(\s*&gt;\s+)(.*)$/, (match, prefix, content) => {
                return `<span class="text-emerald-600 dark:text-emerald-500">${prefix}${content}</span>`;
            });
        }
        // Horizontal rule
        if (/^\s*[-*_]{3,}\s*$/.test(line)) {
            return `<span class="text-zinc-400 dark:text-zinc-600">${line}</span>`;
        }
        // Unordered and task list items
        if (/^(\s*[-*+]\s+)(.*)$/.test(line)) {
            return line.replace(/^(\s*[-*+]\s+)(.*)$/, (match, prefix, content) => {
                if (content.startsWith("[ ]") || content.startsWith("[x]") || content.startsWith("[X]")) {
                    const box = content.substring(0, 3);
                    const rest = content.substring(3);
                    return `<span class="text-amber-600 dark:text-amber-500">${prefix}</span><span class="text-indigo-500 dark:text-indigo-400 font-mono">${box}</span>${rest}`;
                }
                return `<span class="text-amber-600 dark:text-amber-500">${prefix}</span>${content}`;
            });
        }
        // Ordered list items
        if (/^(\s*\d+\.\s+)(.*)$/.test(line)) {
            return line.replace(/^(\s*\d+\.\s+)(.*)$/, (match, prefix, content) => {
                return `<span class="text-amber-600 dark:text-amber-500">${prefix}</span>${content}`;
            });
        }
        return line;
    });

    html = highlightedLines.join("\n");

    // 3. Fenced Code Blocks (```lang ... ```)
    html = html.replace(/(```[a-zA-Z0-9-]*\n[\s\S]*?\n```)/g, (match) => {
        return `<span class="text-zinc-500 dark:text-zinc-400 font-mono">${match}</span>`;
    });

    // 4. Inline code (`code`)
    html = html.replace(/(`[^`\n]+`)/g, (match) => {
        return `<span class="bg-zinc-100 dark:bg-zinc-800/60 text-rose-600 dark:text-rose-400 font-mono rounded">${match}</span>`;
    });

    // 5. Images (![alt](url))
    html = html.replace(/(!\[[^\]]*\]\([^\)]*\))/g, (match) => {
        return `<span class="text-amber-600 dark:text-amber-400">${match}</span>`;
    });

    // 6. Links ([text](url))
    html = html.replace(/(\[[^\]]+\]\([^\)]+\))/g, (match) => {
        return `<span class="text-sky-600 dark:text-sky-400">${match}</span>`;
    });

    // 7. Bold (**text**)
    html = html.replace(/(\*\*[^*]+\*\*)/g, (match) => {
        return `<span class="text-zinc-950 dark:text-zinc-50">${match}</span>`;
    });

    // 8. Italic (*text* or _text_)
    html = html.replace(/(\*[^*]+\*)/g, (match) => {
        return `<span class="text-zinc-850 dark:text-zinc-200">${match}</span>`;
    });
    html = html.replace(/(_[^_]+_)/g, (match) => {
        return `<span class="text-zinc-850 dark:text-zinc-200">${match}</span>`;
    });

    // 9. Strikethrough (~~text~~)
    html = html.replace(/(~~[^~]+~~)/g, (match) => {
        return `<span class="line-through text-zinc-400 dark:text-zinc-500">${match}</span>`;
    });

    return html;
}

// Scoped Markdown rendering CSS style template
const PREVIEW_CSS_VARIABLES = `
.markdown-preview {
    --border-color: #e4e4e7;
    --code-bg: #f4f4f5;
    --code-border: #e4e4e7;
    --inline-code-bg: #f4f4f5;
    --inline-code-border: #e4e4e7;
    --inline-code-color: #dc2626;
    --quote-border: #d4d4d8;
    --quote-color: #71717a;
    --table-border: #e4e4e7;
    --table-header-bg: #f4f4f5;
    --table-row-even-bg: #fafafa;
    --link-color: #2563eb;
    --link-hover-color: #1d4ed8;
}
.dark .markdown-preview {
    --border-color: #27272a;
    --code-bg: #18181b;
    --code-border: #27272a;
    --inline-code-bg: #18181b;
    --inline-code-border: #27272a;
    --inline-code-color: #f43f5e;
    --quote-border: #3f3f46;
    --quote-color: #a1a1aa;
    --table-border: #27272a;
    --table-header-bg: #18181b;
    --table-row-even-bg: #09090b;
    --link-color: #3b82f6;
    --link-hover-color: #60a5fa;
}
`;

const PREVIEW_STYLES = `
${PREVIEW_CSS_VARIABLES}
.markdown-preview {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.6;
    color: inherit;
}
.markdown-preview p {
    margin-top: 0;
    margin-bottom: 1rem;
}
.markdown-preview h1 {
    font-size: 1.875rem;
    font-weight: 700;
    margin-top: 1.75rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.375rem;
}
.markdown-preview h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.25rem;
}
.markdown-preview h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
}
.markdown-preview h4 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
}
.markdown-preview ul {
    list-style-type: disc;
    margin-left: 1.5rem;
    margin-bottom: 1rem;
}
.markdown-preview ol {
    list-style-type: decimal;
    margin-left: 1.5rem;
    margin-bottom: 1rem;
}
.markdown-preview li {
    margin-bottom: 0.25rem;
}
.markdown-preview li > ul,
.markdown-preview li > ol {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
}
.markdown-preview pre {
    background-color: var(--code-bg);
    border: 1px solid var(--code-border);
    border-radius: 0.375rem;
    padding: 1rem;
    overflow-x: auto;
    margin-bottom: 1rem;
}
.markdown-preview pre code {
    background-color: transparent;
    padding: 0;
    border: none;
    border-radius: 0;
    font-size: 0.875rem;
    color: inherit;
}
.markdown-preview code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.875rem;
    background-color: var(--inline-code-bg);
    color: var(--inline-code-color);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    border: 1px solid var(--inline-code-border);
}
.markdown-preview blockquote {
    border-left: 4px solid var(--quote-border);
    padding-left: 1rem;
    color: var(--quote-color);
    font-style: italic;
    margin-bottom: 1rem;
    margin-left: 0;
    margin-right: 0;
}
.markdown-preview table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
    font-size: 0.9rem;
}
.markdown-preview th,
.markdown-preview td {
    border: 1px solid var(--table-border);
    padding: 0.5rem 0.75rem;
    text-align: left;
}
.markdown-preview th {
    background-color: var(--table-header-bg);
    font-weight: 600;
}
.markdown-preview tr:nth-child(even) {
    background-color: var(--table-row-even-bg);
}
.markdown-preview a {
    color: var(--link-color);
    text-decoration: underline;
}
.markdown-preview a:hover {
    color: var(--link-hover-color);
}
.markdown-preview input[type="checkbox"] {
    margin-right: 0.5rem;
    vertical-align: middle;
    cursor: pointer;
}
.markdown-preview hr {
    border: 0;
    border-top: 1px solid var(--border-color);
    margin: 1.5rem 0;
}
`;

// Cache to store successfully rendered SVG strings of Mermaid diagrams to prevent flickering/disappearing during editing
const mermaidCache = new Map<string, string>();

export default function MarkdownEditor() {
    const [content, setContent] = useSessionState("markdown-editor:content", DEFAULT_MARKDOWN);
    const [viewMode, setViewMode] = useSessionState<"split" | "editor" | "preview">("markdown-editor:viewmode", "split");
    const [syncScroll, setSyncScroll] = useSessionState("markdown-editor:syncscroll", true);
    const [wordWrap, setWordWrap] = useSessionState("markdown-editor:wrap", true);
    const [copiedRaw, setCopiedRaw] = useState(false);
    const [copiedHtml, setCopiedHtml] = useState(false);
    const [mermaidInstance, setMermaidInstance] = useState<any>(null);
    const [themeTick, setThemeTick] = useState(0); // Forces mermaid redraw on theme toggle

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    const isScrollingRef = useRef<"editor" | "preview" | null>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

    // Initialise Mermaid library on client side only
    useEffect(() => {
        import("mermaid").then((m) => {
            const isDark = document.documentElement.classList.contains("dark");
            m.default.initialize({
                startOnLoad: false,
                theme: isDark ? "dark" : "default",
                securityLevel: "loose",
                suppressErrorAlerts: true,
            } as any);
            setMermaidInstance(m.default);
        });
    }, []);

    // Listen to dark mode switch triggers to change Mermaid themes dynamically
    useEffect(() => {
        if (!mermaidInstance) return;
        
        const observer = new MutationObserver(() => {
            const isDark = document.documentElement.classList.contains("dark");
            mermaidInstance.initialize({
                startOnLoad: false,
                theme: isDark ? "dark" : "default",
                suppressErrorAlerts: true,
            } as any);
            
            // Clear cache on theme change to ensure new SVG styles are generated correctly
            mermaidCache.clear();
            
            // Mark all mermaid blocks as unprocessed to trigger re-renders
            const blocks = document.querySelectorAll(".mermaid-block");
            blocks.forEach((block) => block.removeAttribute("data-processed"));
            setThemeTick((t) => t + 1);
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, [mermaidInstance]);

    // Unified AST plugin for adding source line numbers and transforming code blocks
    const remarkSourceLineAndMermaid = useCallback(() => {
        return (tree: any) => {
            visit(tree, (node: any) => {
                if (node.position && node.position.start) {
                    if (['heading', 'paragraph', 'list', 'listItem', 'table', 'blockquote', 'html', 'code'].includes(node.type)) {
                        if (!node.data) node.data = {};
                        if (!node.data.hProperties) node.data.hProperties = {};
                        node.data.hProperties['data-line'] = node.position.start.line;
                    }
                }

                if (node.type === 'code' && node.lang === 'mermaid') {
                    const encoded = encodeURIComponent(node.value || "");
                    const cachedSvg = mermaidCache.get(encoded);
                    node.type = 'html';
                    if (cachedSvg) {
                        node.value = `<div class="mermaid-block my-4 overflow-x-auto flex justify-center py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg" data-mermaid="${encoded}" data-processed="true" data-line="${node.position?.start?.line || ''}">${cachedSvg}</div>`;
                    } else {
                        node.value = `<div class="mermaid-block my-4 overflow-x-auto flex justify-center py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg" data-mermaid="${encoded}" data-line="${node.position?.start?.line || ''}"></div>`;
                    }
                } else if (node.type === 'code') {
                    const escapedText = (node.value || "")
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                    node.type = 'html';
                    node.value = `<pre class="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 my-4 overflow-x-auto" data-line="${node.position?.start?.line || ''}"><code class="language-${node.lang || ''}">${escapedText}</code></pre>`;
                }
            });
        };
    }, [themeTick]);

    // Pre-process markdown to auto-split unclosed code blocks if user omitted the newline before closing fence
    const processedContent = useMemo(() => {
        const lines = content.split("\n");
        let inMermaid = false;
        const processedLines = lines.map((line) => {
            if (line.trim().startsWith("```mermaid")) {
                inMermaid = true;
                return line;
            }
            if (inMermaid) {
                if (line.includes("```") && !line.trim().startsWith("```")) {
                    inMermaid = false;
                    return line.replace("```", "\n```");
                }
                if (line.trim() === "```") {
                    inMermaid = false;
                }
            }
            return line;
        });
        return processedLines.join("\n");
    }, [content]);

    // Compile Markdown to HTML using unified AST
    const previewHtml = useMemo(() => {
        try {
            const processor = unified()
                .use(remarkParse)
                .use(remarkGfm)
                .use(remarkSourceLineAndMermaid)
                .use(remarkRehype, { allowDangerousHtml: true })
                .use(rehypeStringify, { allowDangerousHtml: true });
                
            const file = processor.processSync(processedContent);
            return String(file);
        } catch (err) {
            console.error("Unified parse error", err);
            return `<div class="text-red-500 font-semibold p-4">Error parsing markdown content.</div>`;
        }
    }, [processedContent, remarkSourceLineAndMermaid]);

    // Render Mermaid diagrams in HTML preview
    useEffect(() => {
        if (!mermaidInstance) return;

        const renderMermaid = async () => {
            const blocks = document.querySelectorAll(".mermaid-block");
            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i] as HTMLElement;
                const isProcessed = block.getAttribute("data-processed") === "true";
                const hasSvg = block.querySelector("svg") !== null || block.querySelector(".border-red-200") !== null;
                if (isProcessed && hasSvg) continue;

                const encoded = block.getAttribute("data-mermaid");
                if (!encoded) continue;

                const code = decodeURIComponent(encoded);
                const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;

                try {
                    const cleanCode = code.trim();

                    // Pre-validate graph syntax to avoid the browser-default red bomb SVG rendering
                    let syntaxError: any = null;
                    try {
                        await mermaidInstance.parse(cleanCode);
                    } catch (pe: any) {
                        syntaxError = pe;
                    }

                    if (syntaxError) {
                        // Display clean inline warning & fallback plain text editor content
                        block.innerHTML = `
                            <div class="my-2 border border-red-200 dark:border-red-950/40 rounded-lg overflow-hidden w-full text-left">
                                <div class="bg-red-50 dark:bg-red-950/30 px-3 py-1.5 border-b border-red-200 dark:border-red-950/40 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                                    <span>⚠ Mermaid Graph Syntax Error</span>
                                </div>
                                <pre class="bg-zinc-50/50 dark:bg-zinc-950/30 p-3 font-mono text-[11px] text-zinc-500 overflow-x-auto whitespace-pre border-b border-zinc-100 dark:border-zinc-850/50"><code>${cleanCode}</code></pre>
                                <div class="p-3 bg-white dark:bg-zinc-900 text-red-500 dark:text-red-400 text-[11px] font-mono whitespace-pre-wrap">${syntaxError.message || String(syntaxError)}</div>
                            </div>
                        `;
                        block.setAttribute("data-processed", "true");
                        continue;
                    }

                    const { svg } = await mermaidInstance.render(id, cleanCode);
                    block.innerHTML = svg;
                    block.setAttribute("data-processed", "true");
                    mermaidCache.set(encoded, svg);
                } catch (err: any) {
                    console.error("Mermaid error:", err);
                    block.innerHTML = `
                        <div class="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-200 dark:border-red-900 w-full text-left font-mono">
                            <div class="font-bold mb-1">⚠ Mermaid Rendering Error</div>
                            <div class="whitespace-pre-wrap">${err.message || String(err)}</div>
                        </div>
                    `;
                    block.setAttribute("data-processed", "true");
                }
            }
        };

        const timer = setTimeout(renderMermaid, 50);
        return () => clearTimeout(timer);
    }, [previewHtml, mermaidInstance, themeTick]);

    const clearScrollLock = useCallback(() => {
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
            isScrollingRef.current = null;
        }, 150);
    }, []);

    const editorScrollFrame = useRef<number | null>(null);
    const previewScrollFrame = useRef<number | null>(null);

    // Synchronize scroll with the preview pane
    const handleEditorScroll = useCallback(() => {
        if (!syncScroll || viewMode !== "split") return;
        if (isScrollingRef.current === "preview") return;

        isScrollingRef.current = "editor";
        
        if (editorScrollFrame.current) cancelAnimationFrame(editorScrollFrame.current);
        
        editorScrollFrame.current = requestAnimationFrame(() => {
            if (scrollContainerRef.current && previewContainerRef.current) {
                const editorEl = scrollContainerRef.current;
                const previewEl = previewContainerRef.current;
                
                // 1. Calculate which logical line is currently at the top of the editor viewport
                let currentLine = 1;
                const scrollTop = editorEl.scrollTop;
                const paddingTop = 16; 
                
                if (!wordWrap) {
                    const lineHeight = 21.125;
                    currentLine = Math.max(1, Math.floor((scrollTop - paddingTop) / lineHeight) + 1);
                } else if (highlightRef.current) {
                    const spans = highlightRef.current.querySelectorAll('span.absolute');
                    for (let i = 0; i < spans.length; i++) {
                        const span = spans[i] as HTMLElement;
                        if (span.offsetTop >= scrollTop) {
                            currentLine = i + 1;
                            break;
                        }
                    }
                }
                
                // 2. Find the corresponding element in the preview with data-line <= currentLine
                const elements = previewEl.querySelectorAll('[data-line]');
                let closestElement = null;
                let maxLine = -1;
                
                for (let i = 0; i < elements.length; i++) {
                    const el = elements[i];
                    const elLine = parseInt(el.getAttribute('data-line') || "0", 10);
                    if (elLine <= currentLine && elLine > maxLine) {
                        maxLine = elLine;
                        closestElement = el;
                    }
                }
                
                if (closestElement) {
                    const target = closestElement as HTMLElement;
                    previewEl.scrollTop = target.offsetTop - 24; // 24px padding margin
                } else if (scrollTop === 0) {
                    previewEl.scrollTop = 0;
                } else if (scrollTop >= editorEl.scrollHeight - editorEl.clientHeight - 10) {
                    previewEl.scrollTop = previewEl.scrollHeight;
                }
            }
            clearScrollLock();
        });
    }, [syncScroll, viewMode, wordWrap, clearScrollLock]);

    const handlePreviewScroll = useCallback(() => {
        if (!syncScroll || viewMode !== "split") return;
        if (isScrollingRef.current === "editor") return;

        isScrollingRef.current = "preview";
        
        if (previewScrollFrame.current) cancelAnimationFrame(previewScrollFrame.current);
        
        previewScrollFrame.current = requestAnimationFrame(() => {
            if (scrollContainerRef.current && previewContainerRef.current) {
                const editorEl = scrollContainerRef.current;
                const previewEl = previewContainerRef.current;
                const scrollTop = previewEl.scrollTop;
                
                // 1. Find the preview element that is currently near the top of the viewport
                const elements = previewEl.querySelectorAll('[data-line]');
                let topElement = null;
                let minDistance = Infinity;
                
                for (let i = 0; i < elements.length; i++) {
                    const el = elements[i] as HTMLElement;
                    const relativeTop = el.offsetTop - scrollTop;
                    
                    if (relativeTop > -100 && relativeTop < minDistance) {
                        minDistance = relativeTop;
                        topElement = el;
                    }
                }
                
                if (topElement) {
                    const line = parseInt(topElement.getAttribute('data-line') || "1", 10);
                    const paddingTop = 16;
                    
                    if (!wordWrap) {
                        const lineHeight = 21.125;
                        editorEl.scrollTop = Math.max(0, (line - 1) * lineHeight + paddingTop);
                    } else if (highlightRef.current) {
                        const spans = highlightRef.current.querySelectorAll('span.absolute');
                        const span = spans[line - 1] as HTMLElement;
                        if (span) {
                            editorEl.scrollTop = Math.max(0, span.offsetTop - paddingTop);
                        }
                    }
                } else if (scrollTop === 0) {
                    editorEl.scrollTop = 0;
                } else if (scrollTop >= previewEl.scrollHeight - previewEl.clientHeight - 10) {
                    editorEl.scrollTop = editorEl.scrollHeight;
                }
            }
            clearScrollLock();
        });
    }, [syncScroll, viewMode, wordWrap, clearScrollLock]);

    // Sync line count inside editor gutter
    const lineCount = useMemo(() => {
        return content.split("\n").length || 1;
    }, [content]);

    // Toolbar insert logic
    const insertMarkdown = useCallback((before: string, after: string, defaultText: string) => {
        const ta = textareaRef.current;
        if (!ta) return;

        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const text = ta.value;

        const selection = text.slice(start, end) || defaultText;
        const inserted = before + selection + after;
        const newValue = text.slice(0, start) + inserted + text.slice(end);

        setContent(newValue);

        // Retain cursor and focus
        requestAnimationFrame(() => {
            ta.focus();
            const newCursorStart = start + before.length;
            const newCursorEnd = newCursorStart + selection.length;
            ta.setSelectionRange(newCursorStart, newCursorEnd);
        });
    }, []);

    // Clipboard Copy Raw Markdown
    const handleCopyRaw = useCallback(() => {
        navigator.clipboard.writeText(content)
            .then(() => {
                setCopiedRaw(true);
                setTimeout(() => setCopiedRaw(false), 2000);
            })
            .catch((err) => {
                console.error("Failed to copy raw markdown:", err);
            });
    }, [content]);

    // Copy formatted HTML
    const handleCopyHtml = useCallback(() => {
        // Retrieve processed preview wrapper content
        const previewEl = document.getElementById("markdown-preview-root");
        const renderedHtml = previewEl ? previewEl.innerHTML : previewHtml;
        
        navigator.clipboard.writeText(renderedHtml)
            .then(() => {
                setCopiedHtml(true);
                setTimeout(() => setCopiedHtml(false), 2000);
            })
            .catch((err) => {
                console.error("Failed to copy formatted HTML:", err);
            });
    }, [previewHtml]);

    // Export HTML download
    const handleExportHtml = useCallback(() => {
        const previewEl = document.getElementById("markdown-preview-root");
        const renderedHtml = previewEl ? previewEl.innerHTML : previewHtml;

        const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Document</title>
    <style>
        body {
            max-width: 850px;
            margin: 3rem auto;
            padding: 0 1.5rem;
            background-color: #ffffff;
            color: #18181b;
        }
        @media (prefers-color-scheme: dark) {
            body {
                background-color: #09090b;
                color: #fafafa;
            }
        }
        ${PREVIEW_STYLES}
    </style>
</head>
<body>
    <div class="markdown-preview">
        ${renderedHtml}
    </div>
</body>
</html>`;

        const blob = new Blob([template], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "document.html";
        a.click();
        URL.revokeObjectURL(url);
    }, [previewHtml]);

    // Export PDF via high-fidelity print popup window
    const handleExportPdf = useCallback(() => {
        const previewEl = document.getElementById("markdown-preview-root");
        const renderedHtml = previewEl ? previewEl.innerHTML : previewHtml;

        const printWindow = window.open("", "_blank", "width=850,height=600");
        if (!printWindow) {
            alert("Please allow pop-ups to export as PDF");
            return;
        }

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <title>Print Document</title>
    <style>
        body {
            max-width: 850px;
            margin: 2rem auto;
            padding: 0 1.5rem;
            background-color: white;
            color: #18181b;
        }
        ${PREVIEW_STYLES}
        @media print {
            body {
                margin: 0;
                padding: 0;
                max-width: none;
            }
        }
    </style>
</head>
<body>
    <div class="markdown-preview">
        ${renderedHtml}
    </div>
    <script>
        // Trigger print and close the window
        window.onload = function() {
            setTimeout(function() {
                window.print();
                window.close();
            }, 300);
        };
    </script>
</body>
</html>`);
        printWindow.document.close();
    }, [previewHtml]);

    // Interactive Checklist: Toggle checked/unchecked directly on preview panel clicks
    const handlePreviewClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" && (target as HTMLInputElement).type === "checkbox") {
            const previewEl = e.currentTarget;
            const checkboxes = Array.from(previewEl.querySelectorAll('input[type="checkbox"]'));
            const index = checkboxes.indexOf(target as HTMLInputElement);

            if (index !== -1) {
                let count = 0;
                // Regular expression matches both checkboxes '[ ]' and '[x]/[X]'
                const newContent = content.replace(/\[([ xX])\]/g, (match, state) => {
                    if (count === index) {
                        count++;
                        return state === " " ? "[x]" : "[ ]";
                    }
                    count++;
                    return match;
                });
                setContent(newContent);
            }
        }
    }, [content]);

    // Code Editor highlighted overlay HTML
    const highlightedHtml = useMemo(() => {
        const highlighted = highlightMarkdown(content);
        // If content ends with a newline, append a space so the browser doesn't collapse the trailing blank line in <pre>
        const html = content.endsWith("\n") ? highlighted + " " : highlighted;
        
        if (!wordWrap) return html;
        
        // Inject absolute line numbers into the syntax highlighting layer when word wrap is enabled
        return html.split('\n').map((line, i) => {
            return `<span class="absolute left-0 w-[3.5rem] pr-2 text-right text-zinc-400 dark:text-zinc-600 select-none">${i + 1}</span>${line}`;
        }).join('\n');
    }, [content, wordWrap]);

    return (
        <div className="flex flex-col gap-4">
            {/* Scoped CSS styling for preview element */}
            <style dangerouslySetInnerHTML={{ __html: PREVIEW_STYLES }} />

            {/* Editor Workspace Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                {/* Left side: View Mode Switches & Sync Scroll toggle */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
                        <button
                            type="button"
                            onClick={() => setViewMode("split")}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                                viewMode === "split"
                                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white"
                                    : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                            }`}
                        >
                            <Columns className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Split View</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("editor")}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                                viewMode === "editor"
                                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white"
                                    : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                            }`}
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Editor Only</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("preview")}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                                viewMode === "preview"
                                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white"
                                    : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                            }`}
                        >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Preview Only</span>
                        </button>
                    </div>

                    {viewMode === "split" && (
                        <button
                            type="button"
                            onClick={() => setSyncScroll(!syncScroll)}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                                syncScroll
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-400"
                                    : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            }`}
                            title="Toggle synchronized scrolling"
                        >
                            <span>Sync Scroll: {syncScroll ? "ON" : "OFF"}</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setWordWrap(!wordWrap)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                            wordWrap
                                ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-400"
                                : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        }`}
                        title="Toggle word wrap in editor"
                    >
                        <span>Wrap: {wordWrap ? "ON" : "OFF"}</span>
                    </button>
                </div>

                {/* Right side: Global Actions (Copy, Export, Clear) */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCopyRaw}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        title="Copy raw Markdown"
                    >
                        {copiedRaw ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-green-500" />
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy MD</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleCopyHtml}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        title="Copy generated HTML body"
                    >
                        {copiedHtml ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-green-500" />
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <FileText className="h-3.5 w-3.5" />
                                <span>Copy HTML</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleExportHtml}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        title="Export document as complete styled HTML file"
                    >
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                        <span>Export HTML</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleExportPdf}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        title="Export document as PDF"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Export PDF</span>
                    </button>

                    <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

                    <button
                        type="button"
                        onClick={() => {
                            if (window.confirm("Are you sure you want to clear editor content?")) {
                                setContent("");
                            }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/20"
                        title="Clear editor"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Clear</span>
                    </button>
                </div>
            </div>

            {/* Layout Wrapper */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Editor Container */}
                <div
                    className={`flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden ${
                        viewMode === "preview" ? "hidden" : ""
                    } ${viewMode === "editor" ? "lg:col-span-2" : ""}`}
                >
                    {/* Formatting Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50/50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <button
                            type="button"
                            onClick={() => insertMarkdown("**", "**", "Bold Text")}
                            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            title="Bold (**text**)"
                        >
                            <Bold className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => insertMarkdown("*", "*", "Italic Text")}
                            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            title="Italic (*text*)"
                        >
                            <Italic className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => insertMarkdown("## ", "", "Heading")}
                            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            title="Heading 2 (## Heading)"
                        >
                            <Heading className="h-4 w-4" />
                        </button>

                        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

                        <button
                            type="button"
                            onClick={() => insertMarkdown("[", "](url)", "link text")}
                            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            title="Link ([text](url))"
                        >
                            <Link className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => insertMarkdown("![", "](url)", "image description")}
                            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            title="Image (![alt](url))"
                        >
                            <Image className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => insertMarkdown("`", "`", "code")}
                            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            title="Inline Code (`code`)"
                        >
                            <Code className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => insertMarkdown("```javascript\n", "\n```", "console.log('hello');")}
                            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            title="Code Block"
                        >
                            <FileText className="h-4 w-4" />
                        </button>

                        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

                        <button
                            type="button"
                            onClick={() => insertMarkdown("- ", "", "Item")}
                            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            title="Unordered List (- item)"
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => insertMarkdown("1. ", "", "Item")}
                            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            title="Ordered List (1. item)"
                        >
                            <ListOrdered className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => insertMarkdown("- [ ] ", "", "Task")}
                            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            title="Task List (- [ ] item)"
                        >
                            <CheckSquare className="h-4 w-4" />
                        </button>

                        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

                        <button
                            type="button"
                            onClick={() => insertMarkdown("| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n", "", "")}
                            className="rounded p-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            title="Table"
                        >
                            Table
                        </button>
                        <button
                            type="button"
                            onClick={() => insertMarkdown("~~", "~~", "Strikethrough")}
                            className="rounded p-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            title="Strikethrough (~~text~~)"
                        >
                            Del
                        </button>
                        <button
                            type="button"
                            onClick={() => insertMarkdown("> ", "", "Quote")}
                            className="rounded p-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            title="Blockquote (> quote)"
                        >
                            Quote
                        </button>

                        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

                        <button
                            type="button"
                            onClick={() => insertMarkdown("\n```mermaid\ngraph TD\n    A[Start] --> B(Process)\n    B --> C{Choice}\n    C -->|Yes| D[Result 1]\n    C -->|No| E[Result 2]\n```\n", "", "")}
                            className="inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-950/70"
                            title="Insert Mermaid Graph Template"
                        >
                            + Graph
                        </button>
                    </div>

                    {/* Integrated Scroll synced editor viewport (gutter + textarea + highlighter grid) */}
                    <div
                        ref={scrollContainerRef}
                        onScroll={handleEditorScroll}
                        className="flex flex-1 min-h-[450px] max-h-[70vh] overflow-auto bg-white dark:bg-zinc-900 relative w-full"
                    >
                        {/* Line number gutter (only when Word Wrap is OFF) */}
                        {!wordWrap && (
                            <div
                                className="shrink-0 sticky left-0 z-20 self-start select-none border-r border-zinc-200 bg-zinc-50 py-4 pr-3 pl-3 text-right font-mono text-[13px] leading-relaxed text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-600"
                                aria-hidden="true"
                            >
                                {Array.from({ length: lineCount }, (_, i) => (
                                    <div key={i}>{i + 1}</div>
                                ))}
                            </div>
                        )}

                        {/* Editor overlay container */}
                        <div className={`flex-1 self-start ${wordWrap ? "min-w-0 w-full" : "min-w-max"}`}>
                            <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
                                {/* Highlight Layer (rendered behind transparent textarea) */}
                                <div
                                    ref={highlightRef}
                                    className={`pointer-events-none font-mono text-[13px] leading-relaxed ${wordWrap ? "py-4 pr-4 pl-[4.5rem] whitespace-pre-wrap break-words" : "p-4 whitespace-pre"}`}
                                    aria-hidden="true"
                                    dangerouslySetInnerHTML={{
                                        __html: highlightedHtml || "&nbsp;",
                                    }}
                                />

                                {/* Interactive Textarea Layer */}
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Start writing markdown, or click a toolbar button to insert templates..."
                                    spellCheck={false}
                                    wrap={wordWrap ? "soft" : "off"}
                                    className={`relative z-10 block w-full min-h-[450px] resize-none bg-transparent font-mono text-[13px] leading-relaxed outline-none border-0 focus:ring-0 ${wordWrap ? "py-4 pr-4 pl-[4.5rem] whitespace-pre-wrap break-words" : "p-4 whitespace-pre"} ${
                                        content
                                            ? "text-transparent caret-zinc-800 dark:caret-zinc-200"
                                            : "text-zinc-900 dark:text-zinc-100"
                                    }`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Container */}
                <div
                    className={`flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden ${
                        viewMode === "editor" ? "hidden" : ""
                    } ${viewMode === "preview" ? "lg:col-span-2" : ""}`}
                >
                    {/* Preview Header */}
                    <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Live Preview</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                            <HelpCircle className="h-3 w-3" />
                            GFM + Diagrams active
                        </span>
                    </div>

                    {/* Styled rendered content container */}
                    <div
                        ref={previewContainerRef}
                        onScroll={handlePreviewScroll}
                        className="flex-1 min-h-[450px] max-h-[70vh] overflow-y-auto p-6 bg-white dark:bg-zinc-900"
                    >
                        <div
                            id="markdown-preview-root"
                            className="markdown-preview min-h-full text-zinc-800 dark:text-zinc-100"
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                            onClick={handlePreviewClick}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
