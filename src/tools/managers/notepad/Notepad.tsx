"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Copy, Check, Trash2, Download, Search, Maximize2, Minimize2, Type, WrapText, AlignLeft, ArrowLeftRight, ListOrdered } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";
import { useTheme } from "@/lib/theme-context";

export default function Notepad() {
    const { resolvedTheme } = useTheme();
    
    // Basic state
    const [text, setText] = useSessionState("notepad:text", "");
    const [copied, setCopied] = useState(false);
    
    // Typography state
    const [fontFamily, setFontFamily] = useSessionState<"mono" | "sans">("notepad:font", "mono");
    const [fontSize, setFontSize] = useSessionState<"text-sm" | "text-base" | "text-lg" | "text-xl">("notepad:size", "text-sm");
    const [wordWrap, setWordWrap] = useSessionState<boolean>("notepad:wrap", true);
    const [showLineNumbers, setShowLineNumbers] = useSessionState<boolean>("notepad:numbers", true);
    
    // UI state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isWide, setIsWide] = useSessionState<boolean>("notepad:wide", false);
    const [dragActive, setDragActive] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    
    // Search state
    const [findText, setFindText] = useState("");
    const [replaceText, setReplaceText] = useState("");
    
    const [visualLines, setVisualLines] = useState(1);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);

    // Calculate exact number of visual lines by temporarily measuring the textarea's true scroll height
    const updateLineCount = useCallback(() => {
        if (!textareaRef.current || !measureRef.current) return;
        
        const textarea = textareaRef.current;
        const measure = measureRef.current;
        const lineHeight = measure.clientHeight;
        
        if (lineHeight === 0) return;

        const scrollTop = textarea.scrollTop;
        const oldHeight = textarea.style.height;
        
        // Temporarily collapse to 0 to force scrollHeight to represent ONLY the text content
        textarea.style.height = '0px';
        const trueScrollHeight = textarea.scrollHeight;
        
        // Restore immediately
        textarea.style.height = oldHeight;
        textarea.scrollTop = scrollTop;
        
        // py-4 adds 1rem (16px) top and bottom padding = 32px total
        const paddingY = 32;
        const textHeight = trueScrollHeight - paddingY;
        
        // Number of visual lines is the height divided by exact line height
        const lines = Math.max(1, Math.round(textHeight / lineHeight));
        setVisualLines(lines);
    }, []);

    // Update lines whenever layout-affecting state changes
    useEffect(() => {
        updateLineCount();
        
        // Observe window resize as it affects word wrapping
        window.addEventListener('resize', updateLineCount);
        
        return () => window.removeEventListener('resize', updateLineCount);
    }, [text, fontSize, fontFamily, wordWrap, isWide, isFullscreen, updateLineCount]);

    // Actions
    const handleCopy = async () => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        if (window.confirm("Are you sure you want to clear your notes?")) {
            setText("");
        }
    };

    const handleDownload = () => {
        if (!text) return;
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "notes.txt";
        a.click();
        URL.revokeObjectURL(url);
    };

    // Drag and drop handlers
    const handleFile = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                setText(reader.result);
            }
        };
        reader.readAsText(file);
    }, [setText]);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile],
    );

    // Cycle through font sizes
    const cycleFontSize = () => {
        const sizes: typeof fontSize[] = ["text-sm", "text-base", "text-lg", "text-xl"];
        const currentIndex = sizes.indexOf(fontSize);
        setFontSize(sizes[(currentIndex + 1) % sizes.length]);
    };

    // Find and Replace logic
    const handleFindNext = () => {
        if (!textareaRef.current || !findText) return;
        const textarea = textareaRef.current;
        const content = textarea.value;
        const searchIndex = content.toLowerCase().indexOf(findText.toLowerCase(), textarea.selectionEnd);
        
        if (searchIndex !== -1) {
            textarea.focus();
            textarea.setSelectionRange(searchIndex, searchIndex + findText.length);
        } else {
            // Wrap around
            const firstIndex = content.toLowerCase().indexOf(findText.toLowerCase());
            if (firstIndex !== -1) {
                textarea.focus();
                textarea.setSelectionRange(firstIndex, firstIndex + findText.length);
            }
        }
    };

    const handleReplace = () => {
        if (!textareaRef.current || !findText) return;
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        if (start !== end && textarea.value.substring(start, end).toLowerCase() === findText.toLowerCase()) {
            const newText = text.substring(0, start) + replaceText + text.substring(end);
            setText(newText);
            
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.setSelectionRange(start + replaceText.length, start + replaceText.length);
                    handleFindNext();
                }
            }, 0);
        } else {
            handleFindNext();
        }
    };

    const handleReplaceAll = () => {
        if (!findText) return;
        // Simple case-insensitive replace all
        const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        setText(text.replace(regex, replaceText));
    };

    // Calculate stats
    const charCount = text.length;
    const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    // We still show logical lines in the stats footer to be accurate to file structure
    const logicalLineCount = text.split("\n").length;
    
    const content = (
        <div className={`space-y-4 ${isFullscreen ? "flex-1 flex flex-col min-h-0" : ""}`}>
            {/* Hidden measure element to get exact line height in pixels */}
            <div 
                ref={measureRef}
                className={`absolute invisible pointer-events-none ${fontFamily === "mono" ? "font-mono" : "font-sans"} ${fontSize}`}
                style={{ lineHeight: "1.5" }}
            >
                &nbsp;
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCopy}
                        disabled={!text}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        Copy
                    </button>
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={!text}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Download
                    </button>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                        Open File
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".txt,.md,.json,.csv,.log"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFile(file);
                                if (e.target) e.target.value = '';
                            }}
                        />
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={!text}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-950 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear
                    </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 md:border-l md:border-zinc-200 dark:md:border-zinc-700 md:pl-3">
                    <button
                        type="button"
                        onClick={() => setShowSearch(!showSearch)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${showSearch ? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
                        title="Search and Replace"
                    >
                        <Search className="h-3.5 w-3.5" />
                        Find
                    </button>
                    <button
                        type="button"
                        onClick={() => setFontFamily(fontFamily === "mono" ? "sans" : "mono")}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        title={`Switch to ${fontFamily === "mono" ? "Sans-Serif" : "Monospace"} Font`}
                    >
                        <Type className="h-3.5 w-3.5" />
                        {fontFamily === "mono" ? "Mono" : "Sans"}
                    </button>
                    <button
                        type="button"
                        onClick={cycleFontSize}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        title="Change Text Size"
                    >
                        <AlignLeft className="h-3.5 w-3.5" />
                        Size
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowLineNumbers(!showLineNumbers)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${showLineNumbers ? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
                        title="Toggle Line Numbers"
                    >
                        <ListOrdered className="h-3.5 w-3.5" />
                        Numbers
                    </button>
                    <button
                        type="button"
                        onClick={() => setWordWrap(!wordWrap)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${wordWrap ? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
                        title="Toggle Word Wrap"
                    >
                        <WrapText className="h-3.5 w-3.5" />
                        Wrap
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${isFullscreen ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                        {isFullscreen ? "Exit" : "Focus"}
                    </button>
                    {isFullscreen && (
                        <button
                            type="button"
                            onClick={() => setIsWide(!isWide)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            title="Toggle Width"
                        >
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                            {isWide ? "Narrow" : "Wide"}
                        </button>
                    )}
                </div>
            </div>

            {/* Search and Replace Panel */}
            {showSearch && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                    <input 
                        type="text" 
                        placeholder="Find..." 
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleFindNext(); }}
                        className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-indigo-400 dark:focus:border-indigo-500"
                    />
                    <input 
                        type="text" 
                        placeholder="Replace with..." 
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-indigo-400 dark:focus:border-indigo-500"
                    />
                    <div className="flex items-center gap-2">
                        <button onClick={handleFindNext} disabled={!findText} className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg disabled:opacity-50">Find Next</button>
                        <button onClick={handleReplace} disabled={!findText} className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-300 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 rounded-lg disabled:opacity-50">Replace</button>
                        <button onClick={handleReplaceAll} disabled={!findText} className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-200 hover:bg-zinc-300 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg disabled:opacity-50">Replace All</button>
                    </div>
                </div>
            )}

            {/* Editor Area */}
            <div 
                className={`relative group flex ${isFullscreen ? "flex-1 min-h-0" : "h-[500px]"} rounded-xl border transition-colors shadow-sm overflow-hidden
                    ${dragActive ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-500/10" : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/60"}
                    focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:focus-within:border-indigo-500
                `}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
            >
                {/* Gutter */}
                {showLineNumbers && (
                    <div 
                        ref={gutterRef}
                        className={`shrink-0 overflow-hidden text-right py-4 pl-3 pr-2 select-none border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 dark:text-zinc-500
                            ${fontFamily === "mono" ? "font-mono" : "font-sans"} ${fontSize}`}
                        style={{ 
                            lineHeight: "1.5",
                            minWidth: `calc(${Math.max(3, visualLines.toString().length)}ch + 1.25rem)`
                        }}
                    >
                        {Array.from({ length: visualLines }, (_, i) => (
                            <div key={i}>{i + 1}</div>
                        ))}
                    </div>
                )}
                
                {/* Interactive Textarea Layer */}
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onScroll={(e) => {
                        if (gutterRef.current) {
                            gutterRef.current.scrollTop = e.currentTarget.scrollTop;
                        }
                    }}
                    wrap={wordWrap ? "soft" : "off"}
                    spellCheck={false}
                    placeholder="Type your notes here, or drag and drop a text file..."
                    className={`flex-1 min-h-0 overflow-y-auto w-full h-full resize-none px-4 py-4 outline-none bg-transparent border-0 focus:ring-0
                        text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                        ${fontFamily === "mono" ? "font-mono" : "font-sans"} ${fontSize}
                        ${wordWrap ? "whitespace-pre-wrap break-words overflow-x-hidden" : "whitespace-pre overflow-x-auto"}
                    `}
                    style={{ lineHeight: "1.5" }}
                />
                
                {dragActive && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-indigo-500/10 backdrop-blur-[2px] border-2 border-dashed border-indigo-400 pointer-events-none z-10">
                        <div className="px-6 py-3 bg-white dark:bg-zinc-800 rounded-xl shadow-lg font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                            <Download className="w-5 h-5" />
                            Drop text file to load
                        </div>
                    </div>
                )}
            </div>
            
            {/* Footer Stats */}
            <div className="flex gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <span>{charCount} characters</span>
                <span>{wordCount} words</span>
                <span>{logicalLineCount} logical lines</span>
                {showLineNumbers && <span>{visualLines} visual lines</span>}
            </div>
        </div>
    );

    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-[100] bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 flex flex-col h-screen overflow-hidden">
                <div className={`mx-auto flex-1 min-h-0 flex flex-col w-full transition-all duration-300 ${isWide ? "max-w-none" : "max-w-5xl"}`}>
                    {content}
                </div>
            </div>
        );
    }

    return content;
}
