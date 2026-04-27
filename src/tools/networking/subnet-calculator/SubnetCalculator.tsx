"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Trash2 } from "lucide-react";
import { useSessionState } from "@/lib/use-session-state";

// ---------------------------------------------------------------------------
// IPv4 math helpers
// ---------------------------------------------------------------------------

function parseIPv4(ip: string): number | null {
    const parts = ip.trim().split(".");
    if (parts.length !== 4) return null;
    let result = 0;
    for (const p of parts) {
        const n = Number(p);
        if (!Number.isInteger(n) || n < 0 || n > 255) return null;
        result = (result << 8) | n;
    }
    return result >>> 0; // unsigned
}

function ipToString(ip: number): string {
    return [
        (ip >>> 24) & 0xff,
        (ip >>> 16) & 0xff,
        (ip >>> 8) & 0xff,
        ip & 0xff,
    ].join(".");
}

function ipToBinary(ip: number): string {
    return [
        ((ip >>> 24) & 0xff).toString(2).padStart(8, "0"),
        ((ip >>> 16) & 0xff).toString(2).padStart(8, "0"),
        ((ip >>> 8) & 0xff).toString(2).padStart(8, "0"),
        (ip & 0xff).toString(2).padStart(8, "0"),
    ].join(".");
}

function cidrToMask(prefix: number): number {
    if (prefix === 0) return 0;
    return (~0 << (32 - prefix)) >>> 0;
}

function maskToCIDR(mask: number): number | null {
    // Check if mask is contiguous
    let found = false;
    let bits = 0;
    for (let i = 31; i >= 0; i--) {
        const bit = (mask >>> i) & 1;
        if (bit === 1) {
            if (found) return null; // non-contiguous
            bits++;
        } else {
            found = true;
        }
    }
    return bits;
}

function maskFromString(s: string): number | null {
    const ip = parseIPv4(s);
    if (ip === null) return null;
    if (maskToCIDR(ip) === null) return null; // not a valid mask
    return ip;
}

type SubnetResult = {
    ip: number;
    cidr: number;
    mask: number;
    wildcard: number;
    network: number;
    broadcast: number;
    firstHost: number;
    lastHost: number;
    totalHosts: number;
    ipClass: string;
    isPrivate: boolean;
};

function getIPClass(ip: number): string {
    const first = (ip >>> 24) & 0xff;
    if (first < 128) return "A";
    if (first < 192) return "B";
    if (first < 224) return "C";
    if (first < 240) return "D (Multicast)";
    return "E (Reserved)";
}

function isPrivateIP(ip: number): boolean {
    const a = (ip >>> 24) & 0xff;
    const b = (ip >>> 16) & 0xff;
    // 10.0.0.0/8
    if (a === 10) return true;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;
    return false;
}

function calculateSubnet(ipStr: string, cidr: number): SubnetResult | null {
    const ip = parseIPv4(ipStr);
    if (ip === null || cidr < 0 || cidr > 32) return null;

    const mask = cidrToMask(cidr);
    const wildcard = (~mask) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;

    let firstHost: number;
    let lastHost: number;
    let totalHosts: number;

    if (cidr === 32) {
        firstHost = network;
        lastHost = network;
        totalHosts = 1;
    } else if (cidr === 31) {
        // Point-to-point link (RFC 3021)
        firstHost = network;
        lastHost = broadcast;
        totalHosts = 2;
    } else {
        firstHost = (network + 1) >>> 0;
        lastHost = (broadcast - 1) >>> 0;
        totalHosts = Math.pow(2, 32 - cidr) - 2;
    }

    return {
        ip,
        cidr,
        mask,
        wildcard,
        network,
        broadcast,
        firstHost,
        lastHost,
        totalHosts: Math.max(0, totalHosts),
        ipClass: getIPClass(ip),
        isPrivate: isPrivateIP(ip),
    };
}

// ---------------------------------------------------------------------------
// Parse user input: "192.168.1.0/24" or "192.168.1.0 255.255.255.0"
// ---------------------------------------------------------------------------

type ParsedInput = { ip: string; cidr: number } | { error: string };

function parseInput(raw: string): ParsedInput {
    const trimmed = raw.trim();
    if (!trimmed) return { error: "" };

    // CIDR notation: 192.168.1.0/24
    if (trimmed.includes("/")) {
        const [ipPart, cidrPart] = trimmed.split("/");
        const ip = parseIPv4(ipPart);
        if (ip === null) return { error: "Invalid IP address" };
        const cidr = Number(cidrPart);
        if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) {
            return { error: "CIDR prefix must be 0–32" };
        }
        return { ip: ipPart.trim(), cidr };
    }

    // Space-separated: 192.168.1.0 255.255.255.0
    const parts = trimmed.split(/\s+/);
    if (parts.length === 2) {
        const ip = parseIPv4(parts[0]);
        if (ip === null) return { error: "Invalid IP address" };
        const mask = maskFromString(parts[1]);
        if (mask === null) return { error: "Invalid subnet mask" };
        const cidr = maskToCIDR(mask);
        if (cidr === null) return { error: "Non-contiguous subnet mask" };
        return { ip: parts[0], cidr };
    }

    // Just an IP (default to /32)
    if (parseIPv4(trimmed) !== null) {
        return { ip: trimmed, cidr: 32 };
    }

    return { error: "Enter IP/CIDR (e.g. 192.168.1.0/24) or IP + mask" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ResultRow = { label: string; value: string; binary?: string };

export default function SubnetCalculator() {
    const [input, setInput] = useSessionState("subnet-calc:input", "192.168.1.0/24");
    const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);
    const [result, setResult] = useState<SubnetResult | null>(null);
    const [error, setError] = useState("");

    // Client-only computation to avoid hydration issues
    useEffect(() => {
        const parsed = parseInput(input);
        if ("error" in parsed) {
            setError(parsed.error);
            setResult(null);
        } else {
            const sub = calculateSubnet(parsed.ip, parsed.cidr);
            if (sub) {
                setResult(sub);
                setError("");
            } else {
                setError("Calculation error");
                setResult(null);
            }
        }
    }, [input]);

    const rows: ResultRow[] = result
        ? [
            { label: "IP Address", value: ipToString(result.ip), binary: ipToBinary(result.ip) },
            { label: "Network Address", value: ipToString(result.network), binary: ipToBinary(result.network) },
            { label: "Broadcast Address", value: ipToString(result.broadcast), binary: ipToBinary(result.broadcast) },
            { label: "Subnet Mask", value: ipToString(result.mask), binary: ipToBinary(result.mask) },
            { label: "Wildcard Mask", value: ipToString(result.wildcard), binary: ipToBinary(result.wildcard) },
            { label: "CIDR Notation", value: `/${result.cidr}` },
            { label: "First Usable Host", value: ipToString(result.firstHost), binary: ipToBinary(result.firstHost) },
            { label: "Last Usable Host", value: ipToString(result.lastHost), binary: ipToBinary(result.lastHost) },
            { label: "Total Usable Hosts", value: result.totalHosts.toLocaleString() },
            { label: "IP Class", value: result.ipClass },
            { label: "IP Type", value: result.isPrivate ? "Private" : "Public" },
        ]
        : [];

    const copyOne = async (label: string, value: string) => {
        await navigator.clipboard.writeText(value);
        setCopiedLabel(label);
        setTimeout(() => setCopiedLabel(null), 1500);
    };

    const copyAll = async () => {
        const text = rows.map((r) => `${r.label}: ${r.value}`).join("\n");
        await navigator.clipboard.writeText(text);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 1500);
    };

    const handleClear = () => {
        setInput("");
        setResult(null);
        setError("");
    };

    // Quick presets
    const presets = [
        { label: "/8", value: "10.0.0.0/8" },
        { label: "/16", value: "172.16.0.0/16" },
        { label: "/24", value: "192.168.1.0/24" },
        { label: "/28", value: "192.168.1.0/28" },
        { label: "/30", value: "10.0.0.0/30" },
        { label: "/32", value: "10.0.0.1/32" },
    ];

    return (
        <div className="space-y-6">
            {/* ── Input ── */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    IP Address / CIDR
                </label>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="192.168.1.0/24 or 192.168.1.0 255.255.255.0"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 font-mono text-sm text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                    spellCheck={false}
                />
            </div>

            {/* ── Quick presets ── */}
            <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                    <button
                        key={p.value}
                        type="button"
                        onClick={() => setInput(p.value)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${input === p.value
                                ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-600/50 dark:bg-indigo-500/10 dark:text-indigo-400"
                                : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                            }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* ── Error ── */}
            {error && (
                <p className="text-sm font-medium text-red-500 dark:text-red-400">
                    {error}
                </p>
            )}

            {/* ── Actions ── */}
            {result && (
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={copyAll}
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                    >
                        {copiedAll ? (
                            <>
                                <Check className="h-4 w-4 text-emerald-500" /> Copied All!
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" /> Copy All
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                    >
                        <Trash2 className="h-4 w-4" /> Clear
                    </button>
                </div>
            )}

            {/* ── Results table ── */}
            {result ? (
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Property
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Value
                                </th>
                                <th className="hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 md:table-cell">
                                    Binary
                                </th>
                                <th className="w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.label}
                                    className="group border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                                >
                                    <td className="px-4 py-2.5 font-medium text-zinc-600 dark:text-zinc-400">
                                        {row.label}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-zinc-900 dark:text-zinc-100">
                                        {row.value}
                                    </td>
                                    <td className="hidden px-4 py-2.5 font-mono text-xs text-zinc-400 dark:text-zinc-500 md:table-cell">
                                        {row.binary ?? "—"}
                                    </td>
                                    <td className="px-2 py-2.5">
                                        <button
                                            type="button"
                                            onClick={() => copyOne(row.label, row.value)}
                                            className="rounded-md p-1.5 text-zinc-400 opacity-0 transition-all hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                                            title={`Copy ${row.label}`}
                                        >
                                            {copiedLabel === row.label ? (
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
                !error && (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 py-16 text-sm text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                        <span>Enter an IP address to calculate subnet details</span>
                    </div>
                )
            )}
        </div>
    );
}
