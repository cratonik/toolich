"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Copy, Check, MapPin, Globe, Server, Hash, Clock, Navigation } from "lucide-react";
import { useTabContext } from "@/lib/tab-context";

import MapComponent from "./MapComponent";

type IpData = {
    ip: string;
    version: string;
    city: string;
    region: string;
    country_name: string;
    country_code: string;
    latitude: number;
    longitude: number;
    timezone: string;
    asn: string;
    org: string;
    network: string;
    error?: boolean;
    reason?: string;
};

export default function IpLookup() {
    const { viewMode } = useTabContext();
    const [ipInput, setIpInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<IpData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const isMinified = viewMode === "minified";
    const containerHeightClass = isMinified ? "h-[calc(100vh-11rem)]" : "min-h-[70vh]";

    const fetchIpData = async (query: string = "") => {
        setLoading(true);
        setError(null);
        try {
            const endpoint = query ? `https://ipapi.co/${query}/json/` : "https://ipapi.co/json/";
            const res = await fetch(endpoint);
            if (!res.ok) throw new Error("Failed to fetch IP data");
            const json: IpData = await res.json();
            
            if (json.error) {
                throw new Error(json.reason || "Invalid IP address");
            }
            setData(json);
            if (!query) setIpInput(json.ip);
        } catch (err: any) {
            setError(err.message || "An error occurred");
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Auto-detect user's IP on mount
        fetchIpData();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = ipInput.trim();
        if (trimmed) {
            fetchIpData(trimmed);
        } else {
            fetchIpData(); // Empty input looks up own IP
        }
    };

    const copyToClipboard = (text: string, fieldId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const InfoCard = ({ icon: Icon, title, value, fieldId }: { icon: any, title: string, value: string, fieldId: string }) => (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-200 bg-white/50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{title}</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate mt-0.5">{value || "N/A"}</span>
            </div>
            <button
                onClick={() => copyToClipboard(value, fieldId)}
                className="shrink-0 p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                title="Copy value"
            >
                {copiedField === fieldId ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
        </div>
    );

    return (
        <div className={`flex flex-col ${containerHeightClass}`}>
            <div className="flex-none mb-6">
                <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-2xl mx-auto">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="h-5 w-5 text-zinc-400" />
                        </div>
                        <input
                            type="text"
                            value={ipInput}
                            onChange={(e) => setIpInput(e.target.value)}
                            placeholder="Enter an IPv4 or IPv6 address (or leave empty for your IP)"
                            className="block w-full rounded-lg border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Lookup"}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setIpInput(""); fetchIpData(""); }}
                        className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        Clear
                    </button>
                </form>
                {error && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400 text-sm text-center max-w-2xl mx-auto">
                        {error}
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 relative">
                {/* Details Section */}
                <div className="w-full md:w-1/2 flex flex-col overflow-y-auto pr-2 custom-scrollbar gap-3 pb-6">
                    {!data && !loading && !error && (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                            <Globe className="h-12 w-12 mb-4 opacity-20" />
                            <p>Enter an IP address to see details.</p>
                        </div>
                    )}
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                            <p className="mt-4">Fetching details...</p>
                        </div>
                    )}
                    {data && !loading && (
                        <>
                            <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                                <div>
                                    <h3 className="text-sm font-medium text-indigo-100 uppercase tracking-wider mb-1">Queried IP</h3>
                                    <div className="text-2xl sm:text-3xl font-bold tracking-tight break-all">{data.ip}</div>
                                </div>
                                <div className="hidden sm:flex h-12 w-12 rounded-full bg-white/20 items-center justify-center backdrop-blur-md">
                                    <span className="font-bold">{data.version}</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                <InfoCard icon={MapPin} title="Location" value={`${data.city ? data.city + ", " : ""}${data.region ? data.region + ", " : ""}${data.country_name}`} fieldId="loc" />
                                <InfoCard icon={Server} title="ISP / Provider" value={data.org} fieldId="isp" />
                                <InfoCard icon={Hash} title="ASN" value={data.asn} fieldId="asn" />
                                <InfoCard icon={Navigation} title="Coordinates" value={`${data.latitude}, ${data.longitude}`} fieldId="coords" />
                                <InfoCard icon={Clock} title="Timezone" value={data.timezone} fieldId="tz" />
                                <InfoCard icon={Globe} title="Country Code" value={data.country_code} fieldId="cc" />
                            </div>
                        </>
                    )}
                </div>

                {/* Map Section */}
                <div className="w-full md:w-1/2 flex-1 min-h-[300px] flex flex-col shrink-0">
                    <div className="mb-2 flex items-center justify-between px-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            Approximate IP Location
                        </span>
                        <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800">
                            Based on ISP routing
                        </span>
                    </div>
                    <div className="flex-1 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm relative">
                        {data && !loading ? (
                            <MapComponent lat={data.latitude} lon={data.longitude} />
                        ) : (
                            <div className="h-full w-full bg-zinc-100 dark:bg-zinc-900/50 flex items-center justify-center">
                                <MapPin className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
