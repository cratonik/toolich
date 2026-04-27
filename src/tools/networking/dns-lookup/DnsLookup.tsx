"use client";

import { useState } from "react";
import { Copy, Check, Trash2, Search, Loader2 } from "lucide-react";
import { queryDns, type DnsRecord } from "./actions";

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA"];

export default function DnsLookup() {
    const [domain, setDomain] = useState("");
    const [activeType, setActiveType] = useState("A");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Record<string, DnsRecord[]>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);

    const handleLookup = async (type: string = activeType) => {
        if (!domain.trim()) return;

        setLoading(true);
        const { records, error } = await queryDns(domain.trim(), type);
        
        setResults(prev => ({ ...prev, [type]: records }));
        setErrors(prev => ({ ...prev, [type]: error || "" }));
        setLoading(false);
    };

    const handleClear = () => {
        setDomain("");
        setResults({});
        setErrors({});
    };

    const copyOne = async (value: string, id: string) => {
        await navigator.clipboard.writeText(value);
        setCopiedLabel(id);
        setTimeout(() => setCopiedLabel(null), 1500);
    };

    const copyAll = async () => {
        const records = results[activeType] || [];
        if (records.length === 0) return;

        const text = records.map(r => r.value).join("\n");
        await navigator.clipboard.writeText(text);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 1500);
    };

    const currentRecords = results[activeType] || [];
    const currentError = errors[activeType];

    return (
        <div className="space-y-6">
            {/* ── Input ── */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Domain Name
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                            placeholder="example.com"
                            className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-3 font-mono text-sm text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                            spellCheck={false}
                        />
                    </div>
                </div>
                <button
                    onClick={() => handleLookup()}
                    disabled={loading || !domain.trim()}
                    className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup"}
                </button>
            </div>

            {/* ── Tabs ── */}
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-1 dark:border-zinc-800 dark:bg-zinc-900/40">
                {RECORD_TYPES.map((type) => (
                    <button
                        key={type}
                        onClick={() => {
                            setActiveType(type);
                            if (!results[type] && domain.trim()) handleLookup(type);
                        }}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            activeType === type
                                ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-indigo-400"
                                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* ── Actions ── */}
            {(currentRecords.length > 0 || domain) && (
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {currentRecords.length > 0 && (
                            <button
                                onClick={copyAll}
                                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                            >
                                {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                Copy All
                            </button>
                        )}
                        <button
                            onClick={handleClear}
                            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Clear
                        </button>
                    </div>
                    {currentRecords.length > 0 && (
                        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                            {currentRecords.length} {currentRecords.length === 1 ? "record" : "records"} found
                        </span>
                    )}
                </div>
            )}

            {/* ── Results ── */}
            <div className="min-h-[200px]">
                {loading ? (
                    <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        <p className="text-sm text-zinc-500">Querying DNS records...</p>
                    </div>
                ) : currentError ? (
                    <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50/30 text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
                        <Search className="h-8 w-8 opacity-50" />
                        <p className="text-sm font-medium">{currentError}</p>
                    </div>
                ) : currentRecords.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                                    <th className="px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Value</th>
                                    <th className="w-24 px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">TTL</th>
                                    <th className="w-12 px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {currentRecords.map((r, i) => (
                                    <tr key={i} className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                        <td className="px-4 py-3 font-mono text-zinc-900 dark:text-zinc-100 break-all">
                                            {r.value}
                                        </td>
                                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">
                                            {r.ttl ?? "—"}
                                        </td>
                                        <td className="px-2 py-3">
                                            <button
                                                onClick={() => copyOne(r.value, `${activeType}-${i}`)}
                                                className="rounded-md p-1.5 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                                            >
                                                {copiedLabel === `${activeType}-${i}` ? (
                                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                        <Search className="h-8 w-8 opacity-20" />
                        <p className="text-sm">Enter a domain and click Lookup to see results</p>
                    </div>
                )}
            </div>
        </div>
    );
}
