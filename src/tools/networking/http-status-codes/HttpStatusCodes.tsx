"use client";

import { useState, useMemo } from "react";
import { Search, Server, MonitorDown, Copy, CheckCircle2, Info, ArrowRightLeft, ShieldAlert } from "lucide-react";
import { useTabContext } from "@/lib/tab-context";
import { HTTP_STATUS_CODES, StatusCodeCategory, HttpStatusCode } from "./status-codes-data";

export default function HttpStatusCodes() {
    const { viewMode } = useTabContext();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<StatusCodeCategory | "All">("All");
    const [copiedCode, setCopiedCode] = useState<number | null>(null);

    const categories: (StatusCodeCategory | "All")[] = ["All", "Informational", "Success", "Redirection", "Client Error", "Server Error"];

    const filteredCodes = useMemo(() => {
        return HTTP_STATUS_CODES.filter((code) => {
            const matchesSearch = 
                code.code.toString().includes(searchQuery) || 
                code.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                code.description.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCategory = selectedCategory === "All" || code.category === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, selectedCategory]);

    const handleCopy = (code: HttpStatusCode) => {
        const text = `${code.code} ${code.message}\n${code.description}`;
        navigator.clipboard.writeText(text);
        setCopiedCode(code.code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const getCategoryIcon = (category: StatusCodeCategory) => {
        switch (category) {
            case "Informational": return <Info className="h-4 w-4 text-blue-500" />;
            case "Success": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case "Redirection": return <ArrowRightLeft className="h-4 w-4 text-purple-500" />;
            case "Client Error": return <MonitorDown className="h-4 w-4 text-amber-500" />;
            case "Server Error": return <Server className="h-4 w-4 text-rose-500" />;
            default: return <Server className="h-4 w-4 text-zinc-500" />;
        }
    };

    const getCategoryColor = (category: StatusCodeCategory) => {
        switch (category) {
            case "Informational": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/50";
            case "Success": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50";
            case "Redirection": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800/50";
            case "Client Error": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/50";
            case "Server Error": return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800/50";
            default: return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
        }
    };

    const getCategoryBadgeColor = (category: StatusCodeCategory) => {
        switch (category) {
            case "Informational": return "bg-blue-500 text-white shadow-blue-500/20";
            case "Success": return "bg-emerald-500 text-white shadow-emerald-500/20";
            case "Redirection": return "bg-purple-500 text-white shadow-purple-500/20";
            case "Client Error": return "bg-amber-500 text-white shadow-amber-500/20";
            case "Server Error": return "bg-rose-500 text-white shadow-rose-500/20";
            default: return "bg-zinc-500 text-white shadow-zinc-500/20";
        }
    };

    return (
        <div 
            className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden"
            style={{ height: viewMode === "minified" ? "calc(100vh - 11rem)" : "800px", maxHeight: viewMode === "minified" ? "none" : "80vh" }}
        >
            {/* Header & Controls */}
            <div className="flex flex-col gap-4 border-b border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by code (e.g. 404) or keyword..."
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                                selectedCategory === cat
                                    ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                                    : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50/30 dark:bg-black/10">
                {filteredCodes.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400">
                        <Search className="h-8 w-8 opacity-20" />
                        <p className="text-sm font-medium">No status codes found for "{searchQuery}"</p>
                        <button 
                            onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                            className="mt-2 text-xs font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        {filteredCodes.map((code) => (
                            <div 
                                key={code.code}
                                className={`group relative flex flex-col rounded-xl border p-5 transition-all hover:shadow-md ${getCategoryColor(code.category)} bg-white dark:bg-zinc-900/40 backdrop-blur-sm`}
                            >
                                <div className="mb-3 flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm ${getCategoryBadgeColor(code.category)}`}>
                                            <span className="text-lg font-bold tracking-tight">{code.code}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{code.message}</h3>
                                            <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-80 mt-0.5">
                                                {getCategoryIcon(code.category)}
                                                {code.category}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(code)}
                                        className="rounded-md p-2 text-zinc-400 opacity-0 transition-all hover:bg-zinc-100 hover:text-zinc-900 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                        title="Copy Details"
                                    >
                                        {copiedCode === code.code ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                
                                <div className="flex-1 space-y-3 mt-1">
                                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                                        {code.description}
                                    </p>
                                    
                                    {code.useCase && (
                                        <div className="rounded-lg bg-black/[0.03] dark:bg-white/[0.02] p-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 border border-black/[0.05] dark:border-white/[0.05]">
                                            <span className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">When to use:</span>
                                            {code.useCase}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
