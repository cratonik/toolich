"use client";

import { useState, useRef, useCallback } from "react";
import { Copy, Check, Trash2, Download, Search, Maximize2, Minimize2, Type, WrapText, AlignLeft, ArrowLeftRight } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";

export default function Notepad() {
    // Basic state
    const [text, setText] = useSessionState("notepad:text", "");
    const [copied, setCopied] = useState(false);
    
    // Typography state
    const [fontFamily, setFontFamily] = useSessionState<"mono" | "sans">("notepad:font", "mono");
    const [fontSize, setFontSize] = useSessionState<"text-sm" | "text-base" | "text-lg" | "text-xl">("notepad:size", "text-sm");
    const [wordWrap, setWordWrap] = useSessionState<boolean>("notepad:wrap", true);
    
    // UI state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isWide, setIsWide] = useSessionState<boolean>("notepad:wide", false);
    const [showSearch, setShowSearch] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    
    // Search state
    const [findText, setFindText] = useState("");
    const [replaceText, setReplaceText] = useState("");
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Search and Replace
    const handleFindNext = () => {
        if (!findText || !textareaRef.current) return;
        
        const textarea = textareaRef.current;
        const startIndex = textarea.selectionEnd; // Start from current cursor
        const index = text.toLowerCase().indexOf(findText.toLowerCase(), startIndex);
        
        if (index !== -1) {
            textarea.focus();
            textarea.setSelectionRange(index, index + findText.length);
        } else {
            // Loop back to start
            const firstIndex = text.toLowerCase().indexOf(findText.toLowerCase(), 0);
            if (firstIndex !== -1) {
                textarea.focus();
                textarea.setSelectionRange(firstIndex, firstIndex + findText.length);
            } else {
                alert("Text not found");
            }
        }
    };

    const handleReplace = () => {
        if (!findText || !textareaRef.current) return;
        
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        if (start !== end && text.substring(start, end).toLowerCase() === findText.toLowerCase()) {
            const newText = text.substring(0, start) + replaceText + text.substring(end);
            setText(newText);
            
            // Wait for render, then select the new text and find next
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.setSelectionRange(start, start + replaceText.length);
                }
            }, 0);
        } else {
            handleFindNext();
        }
    };

    const handleReplaceAll = () => {
        if (!findText) return;
        
        // Escape find text for regex
        const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapeRegExp(findText), 'gi');
        
        const newText = text.replace(regex, replaceText);
        setText(newText);
    };

    // Cycle through font sizes
    const cycleFontSize = () => {
        const sizes: typeof fontSize[] = ["text-sm", "text-base", "text-lg", "text-xl"];
        const currentIndex = sizes.indexOf(fontSize);
        setFontSize(sizes[(currentIndex + 1) % sizes.length]);
    };

    // Calculate stats
    const charCount = text.length;
    const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    const lineCount = text.split("\n").length;

    const content = (
        <div className={`space-y-4 ${isFullscreen ? "h-full flex flex-col" : ""}`}>
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
                                // reset input so same file can be loaded again
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
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${showSearch ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
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
                className={`relative group ${isFullscreen ? "flex-1 flex flex-col" : ""}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
            >
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your notes here, or drag and drop a text file..."
                    className={`w-full ${isFullscreen ? "flex-1 h-full min-h-0 resize-none" : "min-h-[500px] resize-y"} rounded-xl border p-4 outline-none transition-colors shadow-sm
                        ${dragActive ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-500/10" : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/60"}
                        text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                        focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-500
                        ${fontFamily === "mono" ? "font-mono" : "font-sans"}
                        ${fontSize}
                        ${wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto"}
                    `}
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
                <span>{lineCount} lines</span>
            </div>
        </div>
    );

    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 p-4 md:p-8 flex flex-col h-screen overflow-hidden">
                <div className={`mx-auto flex-1 flex flex-col w-full transition-all duration-300 ${isWide ? "max-w-none" : "max-w-5xl"}`}>
                    {content}
                </div>
            </div>
        );
    }

    return content;
}
